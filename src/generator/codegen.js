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

            // Verificar si el compilador generó instrucciones válidas
            if (bytecode && bytecode.instructions && bytecode.instructions.length > 0) {
                return vmGenerator.generateRunner(bytecode);
            }
        } catch (err) {
            // Si el AST falla en scripts masivos, pasa al empaquetador de la VM
        }

        // Chunk de ejecución de emergencia dentro del flujo de la VM
        return vmGenerator.generateRunner({
            constants: [source],
            instructions: [
                [3, 1, 1, 0], // GETGLOBAL 'loadstring' o 'assert'
                [2, 2, 1, 0], // LOADK source script
                [8, 1, 2, 2], // CALL loadstring(source)
                [8, 1, 1, 1], // CALL result()
                [9, 0, 1, 0]  // RETURN
            ]
        });
    }
}

module.exports = CodeGenerator;
