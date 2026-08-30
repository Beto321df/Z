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
        // Z-PROTECTOR V16.1: POLYMORPHIC CHAOS ENGINE (UNA SOLA CAPA)
        // Alterna entre los 3 estilos de ruido sin trabar el servidor:
        // 1. Letras, números y símbolos
        // 2. Solo letras y símbolos (CERO números)
        // 3. Solo números y símbolos (CERO letras)
        // ====================================================================

        const r = () => "_Z_" + Math.random().toString(36).substring(2, 6) + "_" + Math.floor(Math.random()*900+100);
        const k1 = Math.floor(Math.random() * 180) + 40;
        const k2 = Math.floor(Math.random() * 150) + 20;

        const utf8Buffer = Buffer.from(code, 'utf-8');

        const chaosStyles = [
            // Estilo 1: Letras, números y símbolos
            "abcdefghijklmnopqrstuvwxyz0123456789/.;.,?*#@_+",
            // Estilo 2: Solo letras y símbolos (Sin números)
            "abcdefghijklmnopqrstuvwxyz/.;.,?*#@_+-_",
            // Estilo 3: Solo números y símbolos (Sin letras)
            "0123456789/[]-.;.,?*#@_+"
        ];

        // Selecciona un estilo al azar en cada ofuscación
        const selectedChaosChars = chaosStyles[Math.floor(Math.random() * chaosStyles.length)];
        
        let chunks = [];
        let currentChunk = "";
        
        for (let i = 0; i < utf8Buffer.length; i++) {
            const b = utf8Buffer[i];
            const b1 = b ^ (k2 & 15);
            const b2 = (k1 + (i * 3)) % 256;
            const finalB = b1 ^ b2;

            let noise1 = "", noise2 = "";
            const len1 = Math.floor(Math.random() * 3) + 2;
            const len2 = Math.floor(Math.random() * 3) + 2;
            
            for (let j = 0; j < len1; j++) noise1 += selectedChaosChars[Math.floor(Math.random() * selectedChaosChars.length)];
            for (let j = 0; j < len2; j++) noise2 += selectedChaosChars[Math.floor(Math.random() * selectedChaosChars.length)];

            currentChunk += "/" + noise1 + "=" + finalB + "]" + noise2 + "/";

            if (currentChunk.length > 800 || i === utf8Buffer.length - 1) {
                chunks.push(`"${currentChunk}"`);
                currentChunk = "";
            }
        }

        const varData = r();
        const varKey1 = r();
        const varKey2 = r();
        const varId = r();
        const varBuf = r();
        const varFn = r();
        const varErr = r();

        const payload = `local ${varData}={${chunks.join(",")}};local ${varKey1}=${k1};local ${varKey2}=${k2};if not game then error()end;local t={};for _,${varId} in ipairs(${varData}) do for n in ${varId}:gmatch("=([0-9]+)%]") do t[#t+1]=tonumber(n)end;end;local ${varBuf}=buffer.create(#t);for i=1,#t do local v=t[i];local idx=i-1;local u=bit32.bxor(v,(${varKey1}+(idx*3))%256);buffer.writeu8(${varBuf},idx,bit32.bxor(u,bit32.band(${varKey2},15)));end;
local ${varFn},${varErr}=(getgenv and getgenv().loadstring or loadstring)(buffer.tostring(${varBuf}));if not ${varFn} then error("[ZProtector Chaos]: "..tostring(${varErr})) end;return ${varFn}();`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: payload 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en el motor V16.1: ' + err.message });
    }
}
