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
        // Z-PROTECTOR V14: CHAOS-MATRIX ENGINE (ESTILO GLITCH / MÁXIMO CAOS)
        // Mezcla de escapes decimales con ruido visual estilo matriz y buffers.
        // ====================================================================

        // Generador de nombres con símbolos caóticos estilo Matrix
        const chaosId = () => "_Z_" + Math.random().toString(36).substring(2, 6) + "_" + Math.floor(Math.random()*900+100);
        
        const k1 = Math.floor(Math.random() * 180) + 40;
        const k2 = Math.floor(Math.random() * 150) + 20;

        const utf8Buffer = Buffer.from(code, 'utf-8');
        let packedStream = '';
        for (let i = 0; i < utf8Buffer.length; i++) {
            const b = utf8Buffer[i];
            const b1 = b ^ (k2 & 15);
            const b2 = (k1 + (i * 3)) % 256;
            const finalB = b1 ^ b2;
            packedStream += '\\' + finalB.toString().padStart(3, '0');
        }

        const varData = chaosId();
        const varKey1 = chaosId();
        const varKey2 = chaosId();
        const varBuf = chaosId();
        const varFn = chaosId();
        const varErr = chaosId();
        const decoyChaos = `/* /1212/=-1204/]\\d;fdd,/12dfsd/df.wc/?wf 912912121/]s[[desad]/2-0012' */`;

        // Estructura de 2 líneas con caos visual extremo y velocidad instantánea
        const payload = `${decoyChaos}local ${varData}="${packedStream}";local ${varKey1}=${k1};local ${varKey2}=${k2};if not game then error()end;local ${varBuf}=buffer.fromstring(${varData});for i=0,buffer.len(${varBuf})-1 do local v=buffer.readu8(${varBuf},i);local u=bit32.bxor(v,(${varKey1}+(i*3))%256);buffer.writeu8(${varBuf},i,bit32.bxor(u,bit32.band(${varKey2},15)));end;
local ${varFn},${varErr}=(getgenv and getgenv().loadstring or loadstring)(buffer.tostring(${varBuf}));if not ${varFn} then error("[ZProtector Chaos]: "..tostring(${varErr})) end;return ${varFn}();`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: payload 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en el motor V14: ' + err.message });
    }
}
