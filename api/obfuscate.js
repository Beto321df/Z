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
        // Z-PROTECTOR V11: BULLETPROOF HEX-VM (2 LÍNEAS CON ERROR HANDLER)
        // ====================================================================

        const r = () => "_Z_" + Math.random().toString(36).substring(2, 8);
        const k1 = Math.floor(Math.random() * 180) + 40;
        const k2 = Math.floor(Math.random() * 150) + 20;

        const utf8Buffer = Buffer.from(code, 'utf-8');
        let hexStream = '';
        for (let i = 0; i < utf8Buffer.length; i++) {
            const b = utf8Buffer[i];
            const b1 = b ^ (k2 & 15);
            const b2 = (k1 + (i * 3)) % 256;
            const finalB = b1 ^ b2;
            hexStream += finalB.toString(16).padStart(2, '0');
        }

        const varData = r();
        const varKey1 = r();
        const varKey2 = r();
        const varFunc = r();
        const varFn = r();
        const varErr = r();

        // Estructura de 2 líneas con validación estricta de compilación
        const payload = `local ${varData}="${hexStream}";local ${varKey1}=${k1};local ${varKey2}=${k2};local function ${varFunc}()if not game then error()end;local s="";local l=#${varData};local i=1;while i<l do local b=tonumber(${varData}:sub(i,i+1),16);local idx=#s;local u=bit32.bxor(b,(${varKey1}+(idx*3))%256);local o=bit32.bxor(u,bit32.band(${varKey2},15));s=s..string.char(o);i=i+2;end;return s;end;
local ${varFn},${varErr}=(getgenv and getgenv().loadstring or loadstring)(${varFunc}());if not ${varFn} then error("[ZProtector Error]: "..tostring(${varErr})) end;return ${varFn}();`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: payload 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en el motor V11: ' + err.message });
    }
}
