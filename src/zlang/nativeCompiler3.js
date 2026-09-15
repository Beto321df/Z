const LuauParser = require('../parser/luauParser.js');

const OPS = Object.freeze({
    PUSH_CONST: 1, LOAD_VAR: 2, STORE_VAR: 3, LOAD_GLOBAL: 4, STORE_GLOBAL: 5,
    GET_MEMBER: 6, SET_MEMBER: 7, GET_INDEX: 8, SET_INDEX: 9,
    CALL: 10, CALL_MULTI: 11, CALL_METHOD: 12, CALL_METHOD_MULTI: 13,
    MAKE_FUNCTION: 14, RETURN: 15, RETURN_MULTI: 16, POP: 17, DUP: 18,
    BIN: 19, UNARY: 20, JUMP: 21, JUMP_IF_FALSE: 22, JUMP_IF_TRUE: 23,
    NEW_TABLE: 24, GET_VARARG: 25, FOR_NUM_PREP: 26, FOR_NUM_NEXT: 27,
    ITER_PREP: 28, ITER_NEXT: 29, NOP: 30, BREAK: 31
});
const BIN = Object.freeze({ '+': 1, '-': 2, '*': 3, '/': 4, '%': 5, '^': 6, '..': 7, '==': 8, '~=': 9, '<': 10, '>': 11, '<=': 12, '>=': 13, '//': 14 });
const UNARY = Object.freeze({ not: 1, '-': 2, '#': 3 });

class ProgramBuilder {
    constructor() { this.constants = []; this.constantMap = new Map(); this.functions = []; }
    constant(type, value) {
        const key = `${type}:${String(value)}`;
        if (this.constantMap.has(key)) return this.constantMap.get(key);
        const index = this.constants.length;
        this.constants.push({ type, value });
        this.constantMap.set(key, index);
        return index;
    }
    string(value) { return this.constant(1, String(value)); }
    number(value) { return this.constant(2, Number(value)); }
    boolean(value) { return this.constant(3, value ? 1 : 0); }
    nil() { return this.constant(4, 0); }
    addFunction(fn) { const id = this.functions.length; fn.id = id; this.functions.push(fn); return id; }
}

class FunctionBuilder {
    constructor(program, parent, name) {
        this.program = program; this.parent = parent; this.name = name || `<fn:${program.functions.length}>`;
        this.code = []; this.scopes = [new Map()]; this.localSerial = 0; this.tempSerial = 0;
        this.loopStack = []; this.labels = new Map(); this.pendingGotos = [];
        this.fn = { id: -1, name: this.name, params: [], vararg: false, code: this.code };
    }
    here() { return this.code.length + 1; }
    emit(op, a = 0, b = 0, c = 0, d = 0) { const at = this.code.length; this.code.push([op, a >>> 0, b >>> 0, c >>> 0, d >>> 0]); return at; }
    patch(at, slot, value) { this.code[at][slot] = value >>> 0; }
    pushScope() { this.scopes.push(new Map()); }
    popScope() { if (this.scopes.length > 1) this.scopes.pop(); }
    allocLocal(name) { const key = `@${this.fn.id}:${this.localSerial++}:${name}`; this.scopes[this.scopes.length - 1].set(name, key); return key; }
    allocTemp() { return `@${this.fn.id}:tmp:${this.tempSerial++}`; }
    resolveLocal(name) { for (let i = this.scopes.length - 1; i >= 0; i -= 1) { const found = this.scopes[i].get(name); if (found) return found; } return this.parent ? this.parent.resolveLocal(name) : null; }
    resolve(name) { const local = this.resolveLocal(name); return local ? { local: true, key: local } : { local: false, key: name }; }
    loadName(name) { const r = this.resolve(name); this.emit(r.local ? OPS.LOAD_VAR : OPS.LOAD_GLOBAL, this.program.string(r.key)); }
    storeName(name) { const r = this.resolve(name); this.emit(r.local ? OPS.STORE_VAR : OPS.STORE_GLOBAL, this.program.string(r.key)); }
    compileBlock(body, scoped = true) { if (scoped) this.pushScope(); for (const stmt of body || []) this.emitStatement(stmt); if (scoped) this.popScope(); }
    emitExpr(node, wantMulti = false) {
        if (!node) return this.emit(OPS.PUSH_CONST, this.program.nil());
        switch (node.type) {
            case 'Identifier': this.loadName(node.name); return;
            case 'StringLiteral': this.emit(OPS.PUSH_CONST, this.program.string(node.value)); return;
            case 'NumericLiteral': this.emit(OPS.PUSH_CONST, this.program.number(node.value)); return;
            case 'BooleanLiteral': this.emit(OPS.PUSH_CONST, this.program.boolean(node.value)); return;
            case 'NilLiteral': this.emit(OPS.PUSH_CONST, this.program.nil()); return;
            case 'VarargLiteral': this.emit(OPS.GET_VARARG); return;
            case 'UnaryExpression': this.emitExpr(node.argument); this.emit(OPS.UNARY, UNARY[node.operator]); return;
            case 'BinaryExpression': this.emitExpr(node.left); this.emitExpr(node.right); this.emit(OPS.BIN, BIN[node.operator]); return;
            case 'LogicalExpression': {
                this.emitExpr(node.left); this.emit(OPS.DUP);
                const branch = this.emit(node.operator === 'and' ? OPS.JUMP_IF_FALSE : OPS.JUMP_IF_TRUE);
                this.emit(OPS.POP); this.emitExpr(node.right, wantMulti); this.patch(branch, 1, this.here()); return;
            }
            case 'MemberExpression': this.emitExpr(node.base); this.emit(OPS.GET_MEMBER, this.program.string(node.identifier.name)); return;
            case 'IndexExpression': this.emitExpr(node.base); this.emitExpr(node.index); this.emit(OPS.GET_INDEX); return;
            case 'TableConstructorExpression': {
                this.emit(OPS.NEW_TABLE); let arrayIndex = 1;
                for (const field of node.fields || []) {
                    this.emit(OPS.DUP);
                    if (field.type === 'TableKeyString') { this.emit(OPS.PUSH_CONST, this.program.string(field.key.name)); this.emitExpr(field.value); }
                    else if (field.type === 'TableKey') { this.emitExpr(field.key); this.emitExpr(field.value); }
                    else { this.emit(OPS.PUSH_CONST, this.program.number(arrayIndex++)); this.emitExpr(field.value); }
                    this.emit(OPS.SET_INDEX);
                }
                return;
            }
            case 'FunctionExpression': this.emitFunction(node, false); return;
            case 'CallExpression': this.emitCall(node, wantMulti); return;
            case 'TableCallExpression': this.emitCall({ base: node.base, arguments: node.arguments }, wantMulti); return;
            case 'StringCallExpression': this.emitCall({ base: node.base, arguments: [node.argument] }, wantMulti); return;
            default: throw new Error(`Z expression no soportada: ${node.type}.`);
        }
    }
    emitCall(node, wantMulti) {
        const base = node.base; const args = node.arguments || [];
        if (base?.type === 'MemberExpression' && base.indexer === ':') {
            this.emitExpr(base.base); for (const arg of args) this.emitExpr(arg);
            this.emit(wantMulti ? OPS.CALL_METHOD_MULTI : OPS.CALL_METHOD, this.program.string(base.identifier.name), args.length); return;
        }
        this.emitExpr(base); for (const arg of args) this.emitExpr(arg);
        this.emit(wantMulti ? OPS.CALL_MULTI : OPS.CALL, args.length);
    }
    emitFunction(node, implicitSelf) {
        const child = new FunctionBuilder(this.program, this, `fn${this.program.functions.length}`);
        const id = this.program.addFunction(child.fn); child.fn.id = id; child.fn.vararg = !!node.isVararg;
        if (implicitSelf) child.fn.params.push(this.program.string(child.allocLocal('self')));
        for (const param of node.parameters || []) {
            if (param.type !== 'Identifier') throw new Error('Z parámetro no soportado.');
            child.fn.params.push(this.program.string(child.allocLocal(param.name)));
        }
        child.compileBlock(node.body || [], false);
        child.emit(OPS.PUSH_CONST, this.program.nil()); child.emit(OPS.RETURN, 1); child.resolveGotos();
        this.emit(OPS.MAKE_FUNCTION, id);
    }
    emitAssignmentTarget(node, tempKey) {
        if (node.type === 'Identifier') { this.emit(OPS.LOAD_VAR, this.program.string(tempKey)); this.storeName(node.name); return; }
        if (node.type === 'MemberExpression') { this.emitExpr(node.base); this.emit(OPS.LOAD_VAR, this.program.string(tempKey)); this.emit(OPS.SET_MEMBER, this.program.string(node.identifier.name)); return; }
        if (node.type === 'IndexExpression') { this.emitExpr(node.base); this.emitExpr(node.index); this.emit(OPS.LOAD_VAR, this.program.string(tempKey)); this.emit(OPS.SET_INDEX); return; }
        throw new Error(`Z assignment destino no soportado: ${node.type}.`);
    }
    emitStatement(node) {
        if (!node) return;
        switch (node.type) {
            case 'LocalStatement': {
                const keys = (node.variables || []).map(v => { if (v.type !== 'Identifier') throw new Error('Z local complejo no soportado.'); return this.allocLocal(v.name); });
                const init = node.init || [];
                for (const expr of init) this.emitExpr(expr);
                for (let i = keys.length - 1; i >= 0; i -= 1) { if (i >= init.length) this.emit(OPS.PUSH_CONST, this.program.nil()); this.emit(OPS.STORE_VAR, this.program.string(keys[i])); }
                return;
            }
            case 'AssignmentStatement': {
                const vars = node.variables || []; const init = node.init || []; const temps = [];
                for (let i = 0; i < vars.length; i += 1) { if (init[i]) this.emitExpr(init[i]); else this.emit(OPS.PUSH_CONST, this.program.nil()); const temp = this.allocTemp(); temps.push(temp); this.emit(OPS.STORE_VAR, this.program.string(temp)); }
                for (let i = 0; i < vars.length; i += 1) this.emitAssignmentTarget(vars[i], temps[i]);
                return;
            }
            case 'CallStatement': this.emitExpr(node.expression); this.emit(OPS.POP); return;
            case 'ReturnStatement': {
                const args = node.arguments || [];
                if (!args.length) { this.emit(OPS.PUSH_CONST, this.program.nil()); this.emit(OPS.RETURN, 1); }
                else if (args.length === 1) { this.emitExpr(args[0]); this.emit(OPS.RETURN, 1); }
                else { for (const arg of args) this.emitExpr(arg); this.emit(OPS.RETURN_MULTI, args.length); }
                return;
            }
            case 'IfStatement': {
                const endJumps = [];
                for (let i = 0; i < node.clauses.length; i += 1) {
                    const clause = node.clauses[i];
                    if (clause.type === 'ElseClause') { this.compileBlock(clause.body, true); continue; }
                    this.emitExpr(clause.condition); const no = this.emit(OPS.JUMP_IF_FALSE);
                    this.compileBlock(clause.body, true);
                    if (i < node.clauses.length - 1) endJumps.push(this.emit(OPS.JUMP));
                    this.patch(no, 1, this.here());
                }
                const end = this.here(); for (const at of endJumps) this.patch(at, 1, end); return;
            }
            case 'WhileStatement': {
                const start = this.here(); this.emitExpr(node.condition); const exit = this.emit(OPS.JUMP_IF_FALSE);
                const loop = { breaks: [], continues: [], continueTarget: start }; this.loopStack.push(loop); this.compileBlock(node.body, true); const back = this.emit(OPS.JUMP, start); loop.continueTarget = start;
                const end = this.here(); this.patch(exit, 1, end); for (const at of loop.breaks) this.patch(at, 1, end); for (const at of loop.continues) this.patch(at, 1, loop.continueTarget); this.loopStack.pop(); return;
            }
            case 'RepeatStatement': {
                const start = this.here(); const loop = { breaks: [], continues: [], continueTarget: 0 }; this.loopStack.push(loop); this.compileBlock(node.body, true);
                loop.continueTarget = this.here(); this.emitExpr(node.condition); const back = this.emit(OPS.JUMP_IF_FALSE); this.patch(back, 1, start);
                const end = this.here(); for (const at of loop.breaks) this.patch(at, 1, end); for (const at of loop.continues) this.patch(at, 1, loop.continueTarget); this.loopStack.pop(); return;
            }
            case 'DoStatement': this.compileBlock(node.body, true); return;
            case 'BreakStatement': { const loop = this.loopStack[this.loopStack.length - 1]; if (!loop) throw new Error('Z break fuera de loop.'); loop.breaks.push(this.emit(OPS.BREAK)); return; }
            case 'ContinueStatement': { const loop = this.loopStack[this.loopStack.length - 1]; if (!loop) throw new Error('Z continue fuera de loop.'); loop.continues.push(this.emit(OPS.JUMP)); return; }
            case 'ForNumericStatement': {
                this.emitExpr(node.start); this.emitExpr(node.end); this.emitExpr(node.step || { type: 'NumericLiteral', value: 1 }); this.pushScope();
                const key = this.allocLocal(node.variable.name); const prep = this.emit(OPS.FOR_NUM_PREP, this.program.string(key)); const bodyStart = this.here();
                const loop = { breaks: [], continues: [], continueTarget: 0 }; this.loopStack.push(loop); this.compileBlock(node.body, false);
                loop.continueTarget = this.here(); const next = this.emit(OPS.FOR_NUM_NEXT); this.emit(OPS.JUMP, bodyStart); const end = this.here();
                this.patch(prep, 4, end); this.patch(next, 4, end); for (const at of loop.breaks) this.patch(at, 1, end); for (const at of loop.continues) this.patch(at, 1, loop.continueTarget);
                this.loopStack.pop(); this.popScope(); return;
            }
            case 'ForGenericStatement': {
                const vars = node.variables || []; if (!vars.length || (node.iterators || []).length !== 1) throw new Error('Z generic for requiere un iterador y variables.');
                this.emitExpr(node.iterators[0], true); this.pushScope(); const keys = vars.map(v => this.allocLocal(v.name)); for (const key of keys) this.emit(OPS.PUSH_CONST, this.program.string(key));
                const prep = this.emit(OPS.ITER_PREP, keys.length); const bodyStart = this.here(); const loop = { breaks: [], continues: [], continueTarget: 0 }; this.loopStack.push(loop);
                this.compileBlock(node.body, false); loop.continueTarget = this.here(); const next = this.emit(OPS.ITER_NEXT, 0, bodyStart); const end = this.here();
                this.patch(prep, 4, end); this.patch(next, 4, end); for (const at of loop.breaks) this.patch(at, 1, end); for (const at of loop.continues) this.patch(at, 1, loop.continueTarget);
                this.loopStack.pop(); this.popScope(); return;
            }
            case 'FunctionDeclaration': {
                const identifier = node.identifier; const implicitSelf = identifier?.type === 'MemberExpression' && identifier.indexer === ':'; let localKey = null;
                if (node.isLocal && identifier.type === 'Identifier') localKey = this.allocLocal(identifier.name);
                this.emitFunction(node, !!implicitSelf);
                if (identifier.type === 'Identifier') { if (node.isLocal) this.emit(OPS.STORE_VAR, this.program.string(localKey)); else this.emit(OPS.STORE_GLOBAL, this.program.string(identifier.name)); }
                else if (identifier.type === 'MemberExpression') { this.emitExpr(identifier.base); this.emit(OPS.SET_MEMBER, this.program.string(identifier.identifier.name)); }
                else throw new Error(`Z function target no soportado: ${identifier.type}.`);
                return;
            }
            case 'GotoStatement': { const item = { at: this.emit(OPS.JUMP), label: typeof node.label === 'string' ? node.label : node.label?.name }; this.pendingGotos.push(item); return; }
            case 'LabelStatement': { const name = typeof node.label === 'string' ? node.label : node.label?.name; this.labels.set(name, this.here()); return; }
            case 'TypeDeclaration':
            case 'EmptyStatement': this.emit(OPS.NOP); return;
            default: throw new Error(`Z statement no soportada: ${node.type}.`);
        }
    }
    resolveGotos() { for (const item of this.pendingGotos) { const target = this.labels.get(item.label); if (target === undefined) throw new Error(`Z label no encontrada: ${item.label}.`); this.patch(item.at, 1, target); } }
}

function buildProgram(source) {
    const ast = new LuauParser(source).parse();
    const program = new ProgramBuilder(); const root = new FunctionBuilder(program, null, '<main>'); const rootId = program.addFunction(root.fn); root.fn.id = rootId;
    root.compileBlock(ast.body || [], false); root.emit(OPS.PUSH_CONST, program.nil()); root.emit(OPS.RETURN, 1); root.resolveGotos();
    return { version: 3, root: rootId, constants: program.constants, functions: program.functions, parser: 'Z-native-luau' };
}

module.exports = { OPS, BIN, UNARY, buildProgram };
