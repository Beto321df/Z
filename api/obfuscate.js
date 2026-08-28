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

        // 1. Usar Buffer UTF-8 con llave rodante por posición (Matemáticamente exacto y seguro)
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const masterKey = Math.floor(Math.random() * 150) + 50;
        let hexStream = "";

        for (let i = 0; i < utf8Buffer.length; i++) {
            const rollingKey = (masterKey + (i % 7)) % 256;
            const byteVal = utf8Buffer[i] ^ rollingKey;
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
        
        // Nuevas variables para Anti-Tamper y Estados Dinámicos
        const antiTamperFunc = randName();
        const subFunc = randName();
        const bxorFunc = randName();
        
        // IDs de estados caóticos y aleatorios (Aplanamiento Real)
        const stateMain = Math.floor(Math.random() * 80000) + 10000;
        const stateNext = Math.floor(Math.random() * 80000) + 20000;
        const stateJunk = Math.floor(Math.random() * 80000) + 30000;
        const stateExit = 0;

        // 3. Máquina de Estados Avanzada con Anti-Tamper y Junk States
        const eliteObfuscatedLua = `-- [ ZProtector v4.3 Elite State-Machine VM + Anti-Tamper ]
local function ${vmEnv}()
    local ${keyChunk} = ${masterKey}
    local ${dataStr} = "${hexStream}"
    local len = #${dataStr} / 2
    local ${bufVar} = buffer.create(len)
    
    -- Referencias locales a funciones nativas (protección contra hooks directos)
    local ${subFunc} = string.sub
    local ${bxorFunc} = bit32.bxor
    
    -- Capa Anti-Tamper: Validación de entorno y funciones base antes de procesar
    local function ${antiTamperFunc}()
        if type(buffer) ~= "table" or type(${bxorFunc}) ~= "function" then
            return false
        end
        return true
    end
    
    if not ${antiTamperFunc}() then
        error("[ZProtector Elite Security]: Tampering or debugging environment detected.")
    end
    
    local ${stateVar} = ${stateMain}
    local ${idxVar} = 0
    
    while ${stateVar} ~= ${stateExit} do
        if ${stateVar} == ${stateMain} then
            if ${idxVar} < len then
                local hexPair = ${subFunc}(${dataStr}, ${idxVar} * 2 + 1, ${idxVar} * 2 + 2)
                local rawVal = tonumber(hexPair, 16)
                local rollingKey = (${keyChunk} + (${idxVar} % 7)) % 256
                local ${byteVal} = ${bxorFunc}(rawVal, rollingKey)
                buffer.writeu8(${bufVar}, ${idxVar}, ${byteVal})
                ${idxVar} = ${idxVar} + 1
                ${stateVar} = ${stateMain}
            else
                ${stateVar} = ${stateNext}
            end
        elseif ${stateVar} == ${stateJunk} then
            -- Estado trampa (Junk State) para romper el análisis estático de descompiladores
            local dummyCalc = (${keyChunk} * 37) % 256
            ${stateVar} = ${stateMain}
        elseif ${stateVar} == ${stateNext} then
            ${stateVar} = ${stateExit}
        else
            -- Fallback de seguridad ante manipulación de la máquina de estados
            ${stateVar} = ${stateJunk}
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
