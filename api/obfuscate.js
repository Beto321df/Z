import { obfuscateCustom } from '../Z-protector/obfuscate.js';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Límite amplio para aguantar 6,000+ líneas
        },
    },
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido.' });
    }

    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'Debes pegar tu script de Lua.' });
        }

        const result = obfuscateCustom(code);

        return res.status(200).json({
            success: true,
            obfuscatedCode: result
        });
    } catch (err) {
        return res.status(500).json({ error: 'Error en la ofuscación: ' + err.message });
    }
}
