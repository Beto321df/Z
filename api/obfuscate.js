const CodeGenerator = require('../src/generator/codegen.js');

module.exports = async (req, res) => {
    // Configuración de encabezados CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método no permitido' });
    }

    try {
        const body = req.body || {};
        // Obtener el código fuente de cualquiera de los campos posibles
        const sourceScript = body.code || body.script || body.source || 'print("Z-Protector Loaded")';

        const generator = new CodeGenerator();
        const obfuscated = generator.generate(sourceScript);

        // Devolver el resultado en múltiples claves para garantizar compatibilidad con el frontend
        res.status(200).json({
            success: true,
            code: obfuscated,
            obfuscatedCode: obfuscated,
            result: obfuscated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
