const { tokenize } = require('../zlang/lexer');
const { ZCompiler } = require('../zlang/compiler');

class BytecodeCompiler {
    constructor() {
        this.constants = [];
        this.instructions = [];
        this.registerCount = 1;
    }

    compileSource(source) {
        const tokens = tokenize(source);
        const bytecode = new ZCompiler().compile(tokens);
        this.instructions = Array.from(bytecode, value => ['DATA', value]);
        this.constants = [];
        return { constants: this.constants, instructions: this.instructions, ir: bytecode };
    }

    compile(astOrSource) {
        if (typeof astOrSource === 'string') return this.compileSource(astOrSource);
        if (astOrSource && typeof astOrSource.source === 'string') return this.compileSource(astOrSource.source);
        throw new Error('El compilador legado ahora requiere código fuente para entrar al pipeline Z-Lang.');
    }
}

module.exports = { BytecodeCompiler };
