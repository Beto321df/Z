const luaparse = require('luaparse');
const { BytecodeCompiler } = require('../vm/compiler.js');
const LuauInterpreterGenerator = require('../vm/interpreter.js');

class CodeGenerator {
    generate(rawLuaCode) {
        const source = typeof rawLuaCode === 'string' ? rawLuaCode : rawLuaCode.source;

        try {
            // luaparse genera el AST perfecto de cualquier script sin romperse
            const ast = luaparse.parse(source, { wait: false, luaVersion: '5.1' });

            const compiler = new BytecodeCompiler();
            const bytecode = compiler.compile(ast);

            const vmGenerator = new LuauInterpreterGenerator();
            return vmGenerator.generateRunner(bytecode);
        } catch (err) {
            console.error("Error al parsear Lua:", err.message);
            throw err;
        }
    }
}

module.exports = CodeGenerator;
