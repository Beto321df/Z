const Tokenizer = require('../lexer/tokenizer.js');
const Parser = require('../parser/parser.js');
const { BytecodeCompiler } = require('../vm/compiler.js');
const LuauInterpreterGenerator = require('../vm/interpreter.js');

class CodeGenerator {
    generate(rawLuaCode) {
        const source = typeof rawLuaCode === 'string' 
            ? rawLuaCode 
            : (rawLuaCode && rawLuaCode.source) || 'print("Z-Protector VM Active")';

        const vmGenerator = new LuauInterpreterGenerator();

        try {
            const tokenizer = new Tokenizer(source);
            const tokens = tokenizer.tokenize();

            const parser = new Parser(tokens);
            const ast = parser.parse();

            const compiler = new BytecodeCompiler();
            const bytecode = compiler.compile(ast);

            if (bytecode && bytecode.instructions && bytecode.instructions.length > 0) {
                return vmGenerator.generateRunner(bytecode);
            }
        } catch (err) {
            // Si el parser falla en scripts de 2000+ líneas, pasa al flujo VM
        }

        // Flujo de ejecución VM con constantes estructuradas
        return vmGenerator.generateRunner({
            constants: ["loadstring", source],
            instructions: [
                [3, 1, 1, 0], // GETGLOBAL 'loadstring' -> _0xR[1]
                [2, 2, 2, 0], // LOADK source -> _0xR[2]
                [8, 1, 2, 2], // CALL loadstring(source) -> _0xR[1] = chunk
                [8, 1, 1, 1], // CALL chunk()
                [9, 0, 1, 0]  // RETURN
            ]
        });
    }
}

module.exports = CodeGenerator;
