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
        // Z-PROTECTOR V12: NATIVE DECIMAL ESCAPE ENGINE (EL ESTILO QUE TE GUSTA)
        // Usa escapes decimales de 3 dígitos exactos (\020\221...) interpretados
        // nativamente por Lua y decodificados al vuelo sin errores.
        // ====================================================================

        const r = () => "_Z_" + Math.random().toString(36).substring(2, 8);
        const k1 = Math.floor(Math.random() * 180) + 40;
        const k2 = Math.floor(Math.random() * 150) + 20;

        const utf8Buffer = Buffer.from(code, 'utf-8');
        let packedStream = '';
        for (let i = 0; i < utf8Buffer.length; i++) {
            const b = utf8Buffer[i];
            const b1 = b ^ (k2 & 15);
            const b2 = (k1 + (i * 3)) % 256;
            const finalB = b1 ^ b2;
            // Forzar estrictamente 3 dígitos para que Lua nunca se confunda de número
            packedStream += '\\' + finalB.toString().padStart(3, '0');
        }

        const varData = r();
        const varKey1 = r();
        const varKey2 = r();
        const varFn = r();
        const varErr = r();

        // Estructura limpia de 2 líneas con el formato decimal exacto que pediste
        const payload = `local ${varData}="${packedStream}";local ${varKey1}=${k1};local ${varKey2}=${k2};if not game then error()end;local s="";for i=1,#${varData} do local v=${varData}:byte(i);local idx=#s;local u=bit32.bxor(v,(${varKey1}+(idx*3))%256);s=s..string.char(bit32.bxor(u,bit32.band(${varKey2},15)));end;
local ${varFn},${varErr}=(getgenv and getgenv().loadstring or loadstring)(s);if not ${varFn} then error("[ZProtector Error]: "..tostring(${varErr})) end;return ${varFn}();`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: payload 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en el motor V12: ' + err.message });
    }
}
