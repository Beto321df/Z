import luamin from 'luamin';

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

        // 1. Minificar código (si luamin falla por sintaxis avanzada de Luau, usa el código original)
        let processedCode = code;
        try {
            processedCode = luamin.minify(code);
        } catch (e) {
            processedCode = code;
        }

        // 2. Ofuscación XOR comprimida en Cadena Hexadecimal (Ultra ligera en memoria)
        const xorKey = Math.floor(Math.random() * 200) + 20;
        let hexStream = "";

        for (let i = 0; i < processedCode.length; i++) {
            let byteVal = processedCode.charCodeAt(i) ^ xorKey;
            hexStream += byteVal.toString(16).padStart(2, '0');
        }

        const randName = () => "_0x" + Math.random().toString(36).substring(2, 9);
        const vmEnv = randName();
        const dataStr = randName();
        const keyChunk = randName();
        const bufVar = randName();
        const idxVar = randName();
        const byteVal = randName();

        // 3. VM con Luau Buffers para ejecución instantánea de miles de líneas
        const heavyObfuscatedLua = `-- [ ZProtector v3.0 Heavy VM - High Performance Stream Layer ]
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
        error("[ZProtector Fatal]: Memory buffer corruption or execution failure.")
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
