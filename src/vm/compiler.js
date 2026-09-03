// Opcodes Dinámicos
const OPCODES = {
    LOADCONST: 0x01,
    GETGLOBAL: 0x02,
    CALL:      0x03,
    SETLOCAL:  0x04,
    RETURN:    0x05
};

class BytecodeCompiler {
    compile(ast) {
        const constants = [];
        const instructions = [];

        const addConst = (val) => {
            let idx = constants.indexOf(val);
            if (idx === -1) {
                constants.push(val);
                idx = constants.length - 1;
            }
            return idx;
        };

        for (const node of ast.body) {
            if (node.type === 'CallStatement') {
                // Cargar función global (ej. print)
                const fnIdx = addConst(node.name);
                instructions.push([OPCODES.GETGLOBAL, 0, fnIdx]);

                // Cargar argumentos
                node.args.forEach((arg, i) => {
                    const argIdx = addConst(arg.value);
                    instructions.push([OPCODES.LOADCONST, i + 1, argIdx]);
                });

                // Llamar función: [OPCODE, reg_fn, num_args]
                instructions.push([OPCODES.CALL, 0, node.args.length]);
            }
        }

        instructions.push([OPCODES.RETURN, 0, 0]);

        return { constants, instructions };
    }
}

module.exports = { BytecodeCompiler, OPCODES };
