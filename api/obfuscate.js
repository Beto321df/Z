const CodeGenerator = require('../src/generator/codegen.js');

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
