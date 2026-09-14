const { OPS, BIN, UNARY } = require('./compiler3');

const MULTI = Symbol('Z3Multi');
function multi(values) { return { [MULTI]: true, values }; }
function isMulti(value) { return !!value && typeof value === 'object' && value[MULTI] === true; }
function truthy(value) { return value !== null && value !== undefined && value !== false; }

function luaLen(value) {
    if (typeof value === 'string' || Array.isArray(value)) return value.length;
    if (value && typeof value === 'object') {
        let i = 1;
        while (Object.prototype.hasOwnProperty.call(value, i)) i += 1;
        return i - 1;
    }
    return 0;
}

function getVar(env, key) {
    for (let current = env; current; current = current.parent) {
        if (current.cells.has(key)) return current.cells.get(key).value;
    }
    return undefined;
}

function setVar(env, key, value) {
    for (let current = env; current; current = current.parent) {
        const cell = current.cells.get(key);
        if (cell) { cell.value = value; return; }
    }
    env.cells.set(key, { value });
}

function luaBinary(id, left, right) {
    switch (id) {
        case BIN['+']: return left + right;
        case BIN['-']: return left - right;
        case BIN['*']: return left * right;
        case BIN['/']: return left / right;
        case BIN['%']: return left % right;
        case BIN['^']: return left ** right;
        case BIN['..']: return String(left) + String(right);
        case BIN['==']: return left === right;
        case BIN['~=']: return left !== right;
        case BIN['<']: return left < right;
        case BIN['>']: return left > right;
        case BIN['<=']: return left <= right;
        case BIN['>=']: return left >= right;
        case BIN['//']: return Math.floor(left / right);
        default: throw new Error(`Z reference VM: binary opcode ${id}`);
    }
}

function luaUnary(id, value) {
    switch (id) {
        case UNARY.not: return !truthy(value);
        case UNARY['-']: return -value;
        case UNARY['#']: return luaLen(value);
        default: throw new Error(`Z reference VM: unary opcode ${id}`);
    }
}

function executeProgram(program, globals = {}) {
    const functions = program.functions;
    const constants = program.constants;

    function invoke(fn, args) {
        if (typeof fn !== 'function') throw new Error('Z reference VM: value is not callable');
        const result = fn(...args);
        if (isMulti(result)) return result;
        return multi([result]);
    }

    function makeFn(id, parent) {
        return (...args) => exec(id, parent, args);
    }

    function exec(id, parent, args) {
        const def = functions[id];
        const env = { parent, cells: new Map() };
        for (let i = 0; i < def.params.length; i += 1) env.cells.set(def.params[i], { value: args[i] });
        const varargs = def.vararg ? args.slice(def.params.length) : [];
        const stack = [];
        const loops = [];
        let pc = 1;

        while (pc <= def.code.length) {
            const ins = def.code[pc - 1];
            const op = ins[0];
            const a = ins[1];
            const b = ins[2];
            const c = ins[3];
            const d = ins[4];
            pc += 1;

            if (op === OPS.PUSH_CONST) stack.push(constants[a]);
            else if (op === OPS.LOAD_VAR) stack.push(getVar(env, constants[a]));
            else if (op === OPS.STORE_VAR) setVar(env, constants[a], stack.pop());
            else if (op === OPS.LOAD_GLOBAL) stack.push(globals[constants[a]]);
            else if (op === OPS.STORE_GLOBAL) globals[constants[a]] = stack.pop();
            else if (op === OPS.GET_MEMBER) {
                const obj = stack.pop();
                stack.push(obj?.[constants[a]]);
            } else if (op === OPS.SET_MEMBER) {
                const value = stack.pop();
                const obj = stack.pop();
                obj[constants[a]] = value;
            } else if (op === OPS.GET_INDEX) {
                const key = stack.pop();
                const obj = stack.pop();
                stack.push(obj?.[key]);
            } else if (op === OPS.SET_INDEX) {
                const value = stack.pop();
                const key = stack.pop();
                const obj = stack.pop();
                obj[key] = value;
            } else if (op === OPS.DUP) stack.push(stack[stack.length - 1]);
            else if (op === OPS.POP) stack.pop();
            else if (op === OPS.UNARY) stack.push(luaUnary(a, stack.pop()));
            else if (op === OPS.BIN) {
                const right = stack.pop();
                const left = stack.pop();
                stack.push(luaBinary(a, left, right));
            } else if (op === OPS.JUMP) pc = a;
            else if (op === OPS.JUMP_IF_FALSE) {
                if (!truthy(stack.pop())) pc = a;
            } else if (op === OPS.JUMP_IF_TRUE) {
                if (truthy(stack.pop())) pc = a;
            } else if (op === OPS.MAKE_FUNCTION) stack.push(makeFn(a, env));
            else if (op === OPS.CALL || op === OPS.CALL_MULTI) {
                const callArgs = [];
                for (let i = a - 1; i >= 0; i -= 1) callArgs[i] = stack.pop();
                const fn = stack.pop();
                const result = invoke(fn, callArgs);
                stack.push(op === OPS.CALL_MULTI ? result : result.values[0]);
            } else if (op === OPS.CALL_METHOD || op === OPS.CALL_METHOD_MULTI) {
                const callArgs = [];
                for (let i = b - 1; i >= 0; i -= 1) callArgs[i] = stack.pop();
                const obj = stack.pop();
                const fn = obj?.[constants[a]];
                const result = invoke(fn, [obj, ...callArgs]);
                stack.push(op === OPS.CALL_METHOD_MULTI ? result : result.values[0]);
            } else if (op === OPS.RETURN) return multi([stack.pop()]);
            else if (op === OPS.RETURN_MULTI) {
                const values = [];
                for (let i = a - 1; i >= 0; i -= 1) values[i] = stack.pop();
                return multi(values);
            } else if (op === OPS.GET_VARARG) stack.push(varargs[0]);
            else if (op === OPS.NEW_TABLE) stack.push({});
            else if (op === OPS.FOR_NUM_PREP) {
                const step = stack.pop();
                const finish = stack.pop();
                const start = stack.pop();
                if (step === 0) throw new Error('Z reference VM: numeric for step is zero');
                const frame = { kind: 1, key: constants[a], current: start, finish, step };
                loops.push(frame);
                const keep = step > 0 ? start <= finish : start >= finish;
                if (!keep) { loops.pop(); pc = d; }
                else setVar(env, frame.key, start);
            } else if (op === OPS.FOR_NUM_NEXT) {
                const frame = loops[loops.length - 1];
                frame.current += frame.step;
                const keep = frame.step > 0 ? frame.current <= frame.finish : frame.current >= frame.finish;
                if (keep) setVar(env, frame.key, frame.current);
                else { loops.pop(); pc = d; }
            } else if (op === OPS.ITER_PREP) {
                const keys = [];
                for (let i = a - 1; i >= 0; i -= 1) keys[i] = stack.pop();
                const iterator = stack.pop();
                if (!isMulti(iterator) || iterator.values.length < 3) throw new Error('Z reference VM: iterator setup');
                const [fn, state, control] = iterator.values;
                const first = invoke(fn, [state, control]);
                const frame = { kind: 2, fn, state, control: first.values[0], keys };
                loops.push(frame);
                if (frame.control === undefined || frame.control === null) { loops.pop(); pc = d; }
                else for (let i = 0; i < keys.length; i += 1) setVar(env, keys[i], first.values[i]);
            } else if (op === OPS.ITER_NEXT) {
                const frame = loops[loops.length - 1];
                const next = invoke(frame.fn, [frame.state, frame.control]);
                frame.control = next.values[0];
                if (frame.control === undefined || frame.control === null) { loops.pop(); pc = d; }
                else for (let i = 0; i < frame.keys.length; i += 1) setVar(env, frame.keys[i], next.values[i]);
            } else if (op === OPS.BREAK) {
                loops.pop();
                pc = a;
            } else if (op === OPS.NOP) {
            } else {
                throw new Error(`Z reference VM: opcode ${op}`);
            }
        }
        return multi([undefined]);
    }

    const result = exec(program.root, null, []);
    return result.values[0];
}

module.exports = { executeProgram, multi, isMulti };
