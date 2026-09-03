const CodeGenerator = require('../src/generator/codegen.js');

module.exports = async (req, res) => {
    // Encabezados CORS para permitir peticiones desde cualquier origen
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Responder inmediatamente a las verificaciones de seguridad preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método no permitido' });
    }

    try {
        const { code } = req.body || {};
        const sourceScript = code || 'print("Z-Protector Running")';

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
