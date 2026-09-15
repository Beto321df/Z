const OP_NAMES = Object.freeze({
    1: 'PUSH_CONST', 2: 'LOAD_VAR', 3: 'STORE_VAR', 4: 'LOAD_GLOBAL', 5: 'STORE_GLOBAL',
    6: 'GET_MEMBER', 7: 'SET_MEMBER', 8: 'GET_INDEX', 9: 'SET_INDEX', 10: 'CALL', 11: 'CALL_MULTI',
    12: 'CALL_METHOD', 13: 'CALL_METHOD_MULTI', 14: 'MAKE_FUNCTION', 15: 'RETURN', 16: 'RETURN_MULTI',
    17: 'POP', 18: 'DUP', 19: 'BIN', 20: 'UNARY', 21: 'JUMP', 22: 'JUMP_IF_FALSE',
    23: 'JUMP_IF_TRUE', 24: 'NEW_TABLE', 25: 'GET_VARARG', 26: 'FOR_NUM_PREP', 27: 'FOR_NUM_NEXT',
    28: 'ITER_PREP', 29: 'ITER_NEXT', 30: 'NOP', 31: 'BREAK'
});

function instructionToIR(instruction) {
    if (!Array.isArray(instruction) || instruction.length !== 5) throw new Error('Z IR: instruction inválida.');
    const [op, a, b, c, d] = instruction;
    return { op, name: OP_NAMES[op] || `OP_${op}`, a, b, c, d };
}

function irToInstruction(instruction) {
    if (!instruction || !Number.isInteger(instruction.op)) throw new Error('Z IR: opcode inválido.');
    return [instruction.op >>> 0, instruction.a >>> 0, instruction.b >>> 0, instruction.c >>> 0, instruction.d >>> 0];
}

function programToIR(program) {
    if (!program || program.version !== 3) throw new Error('Z IR: programa Z3 inválido.');
    return {
        version: 1,
        sourceVersion: program.version,
        root: program.root,
        parser: program.parser || 'Z-native-luau',
        constants: program.constants.map(value => ({ type: value.type, value: value.value })),
        functions: program.functions.map(fn => ({
            id: fn.id,
            name: fn.name,
            params: [...fn.params],
            vararg: !!fn.vararg,
            instructions: fn.code.map(instructionToIR)
        }))
    };
}

function validateIR(ir) {
    if (!ir || ir.version !== 1 || !Array.isArray(ir.functions) || !Array.isArray(ir.constants)) throw new Error('Z IR: estructura inválida.');
    if (!Number.isInteger(ir.root) || ir.root < 0 || ir.root >= ir.functions.length) throw new Error('Z IR: root inválido.');
    for (const fn of ir.functions) {
        if (!Array.isArray(fn.instructions)) throw new Error('Z IR: función sin instrucciones.');
        for (const ins of fn.instructions) {
            if (!Number.isInteger(ins.op) || ins.op < 1 || ins.op > 31) throw new Error('Z IR: opcode fuera de rango.');
            for (const key of ['a', 'b', 'c', 'd']) if (!Number.isInteger(ins[key]) || ins[key] < 0) throw new Error(`Z IR: operando inválido ${key}.`);
            if (OP_NAMES[ins.op] !== ins.name) throw new Error('Z IR: nombre de opcode no coincide.');
        }
    }
    return true;
}

function irToProgram(ir) {
    validateIR(ir);
    return {
        version: 3,
        root: ir.root,
        parser: ir.parser || 'Z-native-luau',
        constants: ir.constants.map(value => ({ type: value.type, value: value.value })),
        functions: ir.functions.map(fn => ({
            id: fn.id,
            name: fn.name,
            params: [...fn.params],
            vararg: !!fn.vararg,
            code: fn.instructions.map(irToInstruction)
        }))
    };
}

module.exports = { OP_NAMES, instructionToIR, irToInstruction, programToIR, validateIR, irToProgram };
