
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

        const generator = new CodeGenerator();
        const obfuscatedCode = generator.generate(sourceScript);

        res.status(200).json({
            success: true,
            code: obfuscatedCode,
            obfuscatedCode: obfuscatedCode // <--- Añadimos esto para que coincida con el HTML
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
