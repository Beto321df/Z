export default async function handler(req, res) {
    // Permitir llamados POST desde tu panel web
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

        // 1. Usar Buffer UTF-8 nativo de Node.js para respetar acentos, 'ñ' y caracteres especiales
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const masterKey = Math.floor(Math.random() * 180) + 40;
        let hexStream = "";

        for (let i = 0; i < utf8Buffer.length; i++) {
            // Doble operación matemática rotativa para dificultar el análisis estático
            let byteVal = (utf8Buffer[i] ^ masterKey) + (i % 5);
            byteVal = byteVal % 256;
            hexStream += byteVal.toString(16).padStart(2, '0');
        }

        // 2. Generar nombres aleatorios de variables para la VM
        const randName = () => "_0x" + Math.random().toString(36).substring(2, 9);
        const vmEnv = randName();
        const dataStr = randName();
        const keyChunk = randName();
        const bufVar = randName();
        const idxVar = randName();
        const byteVal = randName();
        const stateVar = randName();

        // 3. Estructura de Máquina de Estados + Luau Buffers (Protegido y ultra rápido)
        const eliteObfuscatedLua = `-- [ ZProtector v4.1 Elite State-Machine VM ]
local function ${vmEnv}()
    local ${keyChunk} = ${masterKey}
    local ${dataStr} = "${hexStream}"
    local len = #${dataStr} / 2
    local ${bufVar} = buffer.create(len)
    
    local ${stateVar} = 1
    local ${idxVar} = 0
    
    while ${stateVar} ~= 0 do
        if ${stateVar} == 1 then
            if ${idxVar} < len then
                local hexPair = string.sub(${dataStr}, ${idxVar} * 2 + 1, ${idxVar} * 2 + 2)
                local rawVal = tonumber(hexPair, 16)
                local unmixed = (rawVal - (${idxVar} % 256)) % 256
                local ${byteVal} = bit32.bxor(unmixed, ${keyChunk})
                buffer.writeu8(${bufVar}, ${idxVar}, ${byteVal})
                ${idxVar} = ${idxVar} + 1
            else
                ${stateVar} = 2
            end
        elseif ${stateVar} == 2 then
            ${stateVar} = 0
        end
    end
    
    local compiledFunc, loadErr = loadstring(buffer.tostring(${bufVar}))
    if not compiledFunc then
        error("[ZProtector Elite Security]: Critical virtualization fault -> " .. tostring(loadErr))
    end
    return compiledFunc()
end

return ${vmEnv}()`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: eliteObfuscatedLua 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico al procesar la ofuscación de élite.' });
    }
}
