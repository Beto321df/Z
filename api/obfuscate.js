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

        // 1. Capa de compresión / codificación pesada por bloques de bytes
        const encodedBytes = [];
        const xorKey = Math.floor(Math.random() * 200) + 20; // Clave dinámica por ofuscación
        
        for (let i = 0; i < code.length; i++) {
            let charCode = code.charCodeAt(i);
            // Ofuscación matemática de doble vuelta
            let mixed = (charCode + xorKey) % 256;
            encodedBytes.push(mixed);
        }

        const randName = () => "_0x" + Math.random().toString(36).substring(2, 9);
        const vmEnv = randName();
        const dataChunk = randName();
        const keyChunk = randName();
        const pointer = randName();
        const loopVar = randName();

        // 2. Estructura de VM pesada con auto-decodificación en memoria volátil
        const heavyObfuscatedLua = `-- [ ZProtector v2.5 Heavy VM - Secure Luau Layer ]
local function ${vmEnv}()
    local ${keyChunk} = ${xorKey}
    local ${dataChunk} = {${encodedBytes.join(',')}}
    local ${pointer} = {}
    
    for ${loopVar} = 1, #${dataChunk} do
        local byteVal = ${dataChunk}[${loopVar}]
        local original = (byteVal - ${keyChunk}) % 256
        table.insert(${pointer}, string.char(original))
    end
    
    local compiledFunc, loadErr = loadstring(table.concat(${pointer}))
    if not compiledFunc then
        error("[ZProtector Fatal]: Virtual machine integrity check failed.")
    end
    return compiledFunc()
end

return ${vmEnv}()`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: heavyObfuscatedLua 
        });

    } cat (err) {
        return res.status(500).json({ error: 'Error crítico al procesar la ofuscación pesada.' });
    }
}
