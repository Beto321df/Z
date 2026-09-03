const CodeGenerator = require('../src/generator/codegen.js');

module.exports = async (req, res) => {
    try {
        const { code } = req.body || {};
        const sourceScript = code || 'print("Hola Roblox")';

        const generator = new CodeGenerator();
        const obfuscatedCode = generator.generate(sourceScript);

        res.status(200).json({
            success: true,
            code: obfuscatedCode
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
