export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb',
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
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { code } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Debes proporcionar un código Lua válido.' });
        }

        // ====================================================================
        // Z-PROTECTOR ULTRA-COMPACT v8.0 (2-LINE BUFFER MACHINE)
        // Máximo blindaje en memoria, cero desbordamiento de líneas.
        // ====================================================================

        const r = () => "_Z_" + Math.random().toString(36).substring(2, 8);
        
        const dataVar = r();
        const keyVar = r();
        const decFunc = r();
        const execVar = r();

        // 1. Cifrado por bloques optimizado de todo el script en un solo flujo hexadecimal
        const vmKey = Math.floor(Math.random() * 200) + 50;
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const hexChunks = [];

        for (let i = 0; i < utf8Buffer.length; i++) {
            const charCode = utf8Buffer[i];
            const altered = charCode ^ ((vmKey + i) % 255);
            hexChunks.push(altered.toString(16).padStart(2, '0'));
        }
        const encryptedHexStream = hexChunks.join('');

        // 2. Estructura compacta comprimida estrictamente en 2 líneas de código Lua
        const compactPayload = `local ${dataVar}="${encryptedHexStream}";local ${keyVar}=${vmKey};local function ${decFunc}()if not game then error("Sandbox Error")end;local o=buffer.create(#${dataVar}/2);for i=1,#${dataVar}/2 do local x=tonumber(${dataVar}:sub(i*2-1,i*2),16);buffer.writeu8(o,i-1,x~(${keyVar}+(i-1))%255);end;return buffer.tostring(o);end;
local ${execVar}=(getgenv and getgenv().loadstring or loadstring)(${decFunc}())();return ${execVar};`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: compactPayload 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en el motor ZProtector: ' + err.message });
    }
}
