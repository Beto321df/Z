const CodeGenerator = require('../src/generator/stableCodegen.js');
const luaparse = require('luaparse');

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
        const obfuscatedCode = new CodeGenerator().generate(sourceScript);
        luaparse.parse(obfuscatedCode, { wait: false, comments: false, luaVersion: '5.1' });

        res.status(200).json({
            success: true,
            engine: 'Z-Lang 3',
            mode: 'zlang3-stable',
            format: 'Z-Bytecode / Stack VM',
            parser: 'luaparse',
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
