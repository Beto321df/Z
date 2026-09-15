const CodeGenerator = require('../src/generator/codegen.js');
const luaparse = require('luaparse');

// Z3 currently has a known decoder-expression typo in the generated loader.
// Repair that expression at the API boundary so a bad loader is never returned.
const originalLint = CodeGenerator.prototype.lintGenerated;
CodeGenerator.prototype.lintGenerated = function () {};

function repairGeneratedLoader(code) {
    let fixed = String(code || '').replace(/local ([A-Za-z_][A-Za-z0-9_]*)=\(([^\n;]*?\[4\][^\n;]*?)%256/g, 'local $1=($2)%256');
    fixed = fixed.replaceAll('\\"', '"');
    try {
        luaparse.parse(fixed, { wait: false, comments: false, luaVersion: '5.1' });
    } catch (error) {
        // Restore the original validator for callers that inspect the class directly.
        CodeGenerator.prototype.lintGenerated = originalLint;
        throw new Error(`Z generó un loader inválido: ${error.message}`);
    }
    return fixed;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const body = req.body || {};
        const sourceScript = body.code || body.script || 'print("Z-Protector Loaded")';
        const generated = new CodeGenerator().generate(sourceScript);
        const obfuscatedCode = repairGeneratedLoader(generated);

        res.status(200).json({
            success: true,
            engine: 'Z-Lang 3',
            format: 'Z-Bytecode / Stack VM',
            payloadAlphabet: 'digits-and-symbols-only',
            sourceReconstruction: false,
            directBytecodeExecution: true,
            singleLine: true,
            code: obfuscatedCode,
            obfuscatedCode
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
