export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb', // Tamaño límite alto para los scripts masivos
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
        // Z-PROTECTOR V17.0: ABSOLUTE CHAOS ENGINE (CAPA ÚNICA)
        // Optimizadísimo para +5000 líneas.
        // Símbolos, letras y números al máximo nivel de ilegibilidad.
        // ====================================================================

        const r = () => "_Z_" + Math.random().toString(36).substring(2, 6) + "_" + Math.floor(Math.random()*900+100);
        const k1 = Math.floor(Math.random() * 180) + 40;
        const k2 = Math.floor(Math.random() * 150) + 20;

        const utf8Buffer = Buffer.from(code, 'utf-8');

        // CAOS TOTAL: Todos los caracteres que pediste mezclados.
        // OJO: Excluimos '{' y '}' porque los usaremos como delimitadores seguros.
        const chaosChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,./;'[]\\=-+_/*-!@#$%^&*()";

        let chunks = [];
        let currentChunk = [];
        
        // Bucle optimizado usando arrays para no saturar la RAM con strings gigantes
        for (let i = 0; i < utf8Buffer.length; i++) {
            const b = utf8Buffer[i];
            const b1 = b ^ (k2 & 15);
            const b2 = (k1 + (i * 3)) % 256;
            const finalB = b1 ^ b2;

            let noise1 = "";
            let noise2 = "";
            
            // Más cantidad de basura por byte para engrosar la ofuscación (3 a 7 caracteres de ruido de cada lado)
            const len1 = Math.floor(Math.random() * 5) + 3; 
            const len2 = Math.floor(Math.random() * 5) + 3;

            for (let j = 0; j < len1; j++) noise1 += chaosChars[Math.floor(Math.random() * chaosChars.length)];
            for (let j = 0; j < len2; j++) noise2 += chaosChars[Math.floor(Math.random() * chaosChars.length)];

            // Envolvemos el byte real en { } para que el gmatch de Lua no se confunda con la basura
            currentChunk.push(noise1 + "{" + finalB + "}" + noise2);

            // Cada 500 bytes creamos un chunk nuevo para que Roblox no sufra leyendo un string infinito
            if (currentChunk.length >= 500 || i === utf8Buffer.length - 1) {
                let joined = currentChunk.join("");
                // Prevención de errores: Evita que el caos genere por accidente el cierre de string ]=] de Lua
                joined = joined.replace(/\]\=\]/g, "]-]"); 
                chunks.push(`[=[${joined}]=]`);
                currentChunk = [];
            }
        }

        const varData = r();
        const varKey1 = r();
        const varKey2 = r();
        const varId = r();
        const varBuf = r();
        const varFn = r();
        const varErr = r();

        // El regex ahora es "{([0-9]+)}" para extraer el byte de entre toda la nueva tormenta de símbolos
        const payload = `local ${varData}={${chunks.join(",")}};local ${varKey1}=${k1};local ${varKey2}=${k2};if not game then error()end;local t={};for _,${varId} in ipairs(${varData}) do for n in ${varId}:gmatch("{([0-9]+)}") do t[#t+1]=tonumber(n)end;end;local ${varBuf}=buffer.create(#t);for i=1,#t do local v=t[i];local idx=i-1;local u=bit32.bxor(v,(${varKey1}+(idx*3))%256);buffer.writeu8(${varBuf},idx,bit32.bxor(u,bit32.band(${varKey2},15)));end;
local ${varFn},${varErr}=(getgenv and getgenv().loadstring or loadstring)(buffer.tostring(${varBuf}));if not ${varFn} then error("[ZProtector Chaos]: "..tostring(${varErr})) end;return ${varFn}();`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: payload 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en el motor V17.0: ' + err.message });
    }
}
