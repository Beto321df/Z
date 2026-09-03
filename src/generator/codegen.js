const Tokenizer = require('../lexer/tokenizer.js');
const Parser = require('../parser/parser.js');
const { BytecodeCompiler } = require('../vm/compiler.js');
const LuauInterpreterGenerator = require('../vm/interpreter.js');

class CodeGenerator {
    generate(rawLuaCode) {
        const source = typeof rawLuaCode === 'string' 
            ? rawLuaCode 
            : (rawLuaCode && rawLuaCode.source) || 'print("Z-Protector VM Active")';

        // 1. Tokenización
        const tokenizer = new Tokenizer(source);
        const tokens = tokenizer.tokenize();

        // 2. Parsing AST
        const parser = new Parser(tokens);
        const ast = parser.parse();

        // 3. Compilación a Bytecode Custom
        const compiler = new BytecodeCompiler();
        const bytecode = compiler.compile(ast);

        // 4. Generación de intérprete VM
        const vmGenerator = new LuauInterpreterGenerator();
        let runnerCode = vmGenerator.generateRunner(bytecode);

        // Aseguramos que la primera línea no cause conflictos con expresiones de Luau
        if (typeof runnerCode === 'string') {
            runnerCode = runnerCode.trim();
            // Si por alguna razón empieza con corchete, lo envolvemos correctamente
            if (runnerCode.startsWith('[')) {
                runnerCode = `;(function()\n return ${runnerCode}\n})();`;
            }
        }

        return runnerCode;
    }
}

module.exports = CodeGenerator;
