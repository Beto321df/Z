export const config = {
    api: {
        bodyParser: { sizeLimit: '4mb' },
    },
};

export default async function handler(req, res) {
    // Configuración de CORS para que tu .html pueda conectarse
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    try {
        const { code } = req.body;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Debes proporcionar un código Lua válido.' });
        }

        // 1. Crear una sesión en la API de ofuscación real
        const uploadRes = await fetch('https://www.luaobfuscator.com/api/obfuscator/newscript', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: code
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadData.sessionId) {
            throw new Error('La API externa no regresó un ID de sesión.');
        }

        // 2. Pedir la ofuscación "A lo fuerte" (Máquina Virtual, CFF, Anti-Tamper)
        const obfuscateRes = await fetch('https://www.luaobfuscator.com/api/obfuscator/obfuscate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: uploadData.sessionId,
                config: {
                    MinifyAll: true, // Quita espacios y nombres
                    Virtualize: true, // CREA LA MÁQUINA VIRTUAL (Lo que querías)
                    CustomPlugins: {
                        ControlFlowFlattenV1AllBlocks: true, // El laberinto de lógica
                        EncryptStrings: true, // Esconde los textos
                        SwizzleVariables: true, // Revuelve los nombres de las variables
                        AntiTamper: true // Si intentan modificarlo, se rompe
                    }
                }
            })
        });

        const obfuscateData = await obfuscateRes.json();

        if (!obfuscateData.code) {
            throw new Error('Fallo al generar el código ofuscado.');
        }

        // 3. Entregar el código blindado al cliente
        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: obfuscateData.code 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en el puente Vercel: ' + err.message });
    }
}
