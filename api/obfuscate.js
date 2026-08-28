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

        // 1. Usar Buffer UTF-8 nativo para leer cada byte respetando acentos, 'ñ' y caracteres especiales
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const xorKey = Math.floor(Math.random() * 200) + 20;
        let hexStream = "";

        for (let i = 0; i < utf8Buffer.length; i++) {
            let byteVal = utf8Buffer[i] ^ xorKey;
            hexStream += byteVal.toString(16).padStart(2, '0');
        }

        const randName = () => "_0x" + Math.random().toString(36).substring(2, 9);
        const vmEnv = randName();
        const dataStr = randName();
        const keyChunk = randName();
        const bufVar = randName();
        const idxVar = randName();
        const byteVal = randName();

        // 2. VM con Luau Buffers (Sin minificador para mantener intactas las tablas de tu UI)
        const heavyObfuscatedLua = `-- [ ZProtector v3.1 Safe Heavy VM - UI Protected ]
local function ${vmEnv}()
    local ${keyChunk} = ${xorKey}
    local ${dataStr} = "${hexStream}"
    local len = #${dataStr} / 2
    local ${bufVar} = buffer.create(len)
    
    for ${idxVar} = 0, len - 1 do
        local hexPair = string.sub(${dataStr}, ${idxVar} * 2 + 1, ${idxVar} * 2 + 2)
        local ${byteVal} = bit32.bxor(tonumber(hexPair, 16), ${keyChunk})
        buffer.writeu8(${bufVar}, ${idxVar}, ${byteVal})
    end
    
    local compiledFunc, loadErr = loadstring(buffer.tostring(${bufVar}))
    if not compiledFunc then
        error("[ZProtector Fatal]: " .. tostring(loadErr))
    end
    return compiledFunc()
end

return ${vmEnv}()`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: heavyObfuscatedLua 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico al procesar el script masivo.' });
    }
}
