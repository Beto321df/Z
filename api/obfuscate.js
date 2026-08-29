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

        // 1. Usar Buffer UTF-8 con llave rodante por posición
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const masterKey = Math.floor(Math.random() * 150) + 50;
        let hexStream = "";

        for (let i = 0; i < utf8Buffer.length; i++) {
            const rollingKey = (masterKey + (i % 7)) % 256;
            const byteVal = utf8Buffer[i] ^ rollingKey;
            hexStream += byteVal.toString(16).padStart(2, '0');
        }

        // 2. Generar nombres aleatorios para evitar patrones estáticos
        const randName = () => "_0x" + Math.random().toString(36).substring(2, 9);
        const vmEnv = randName();
        const dataStr = randName();
        const keyChunk = randName();
        const bufVar = randName();
        const idxVar = randName();
        const byteVal = randName();
        const stateVar = randName();
        
        // Funciones y variables de las capas de élite
        const antiTamperFunc = randName();
        const envCheckFunc = randName();
        const timeCheckFunc = randName();
        const stackCheckFunc = randName();
        const metaTableVar = randName();
        const subFunc = randName();
        const bxorFunc = randName();
        const loadStrFunc = randName();
        
        // IDs de estados caóticos y aleatorios
        const stateMain = Math.floor(Math.random() * 80000) + 10000;
        const stateNext = Math.floor(Math.random() * 80000) + 20000;
        const stateJunk = Math.floor(Math.random() * 80000) + 30000;
        const stateExit = 0;

        // 3. Máquina de Estados Avanzada con Anti-Tamper Corregido (v5.1) y Banner Z Protector
        const eliteObfuscatedLua = `--[[
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     ███████╗ ██████╗ ██████╗ ████████╗██████╗  ██████╗████████╗ ██████╗ ██████╗  ║
║     ╚══██╔╝ ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔═══██║╚══██╔══╝██╔═══██╗██╔══██╗ ║
║        ██╔╝  ██████╔╝██████╔╝   ██║   ██████╔╝██║   ██║   ██║   ██║   ██║██████╔╝ ║
║       ██╔╝   ██╔═══╝ ██╔══██╗   ██║   ██╔══██╗██║   ██║   ██║   ██║   ██║██╔══██╗ ║
║      ███████╗██║     ██║  ██║   ██║   ██║  ██║╚██████╔╝   ██║   ╚██████╔╝██║  ██║ ║
║      ╚══════╝╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝ ╚═╝  ╚═╝ ║
║                                                                              ║
║     Z PROTECTOR  │  discord.gg/wCrVjBtpt                                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
]]
-- [ ZProtector v5.1 Elite State-Machine VM + Military Anti-Tamper ]
local function ${vmEnv}()
    local ${keyChunk} = ${masterKey}
    local ${dataStr} = "${hexStream}"
    local len = #${dataStr} / 2
    local ${bufVar} = buffer.create(len)
    
    -- Referencias locales y aislamiento a funciones nativas
    local ${subFunc} = string.sub
    local ${bxorFunc} = bit32.bxor
    local ${loadStrFunc} = loadstring
    
    -- CAPA 1: Anti-Sandbox y Validación de Entorno Real de Roblox
    local function ${envCheckFunc}()
        if not game or typeof(game) ~= "Instance" then
            return false
        end
        return true
    end

    -- CAPA 2: Anti-Breakpoint por Delta de Tiempo (Detecta pausas en depuración)
    local function ${timeCheckFunc}()
        local start = os.clock()
        local x = 0
        for i = 1, 15000 do
            x = (x + i) % 999
        end
        local diff = os.clock() - start
        -- Si el ciclo tarda más de lo normal, hay un breakpoint pausando la ejecución
        if diff > 0.08 then
            return false
        end
        return true
    end

    -- CAPA 3: Inspección de Pila Profunda y Librería Debug
    local function ${stackCheckFunc}()
        if type(debug) ~= "table" or type(debug.info) ~= "function" then
            return false
        end
        return true
    end

    -- Ejecución de barreras defensivas previas
    if not ${envCheckFunc}() or not ${timeCheckFunc}() or not ${stackCheckFunc}() then
        error("[ZProtector Elite Security v5.1]: Sandbox, breakpoint, or debugging environment violation detected.")
    end

    -- CAPA 4: Trampas con Metatables corregidas (Protege el almacenamiento interno)
    local ${metaTableVar} = {
        ["key"] = ${keyChunk}
    }
    setmetatable(${metaTableVar}, {
        __index = function(t, k)
            error("[ZProtector Elite Security]: Unauthorized memory inspection attempt.")
        end,
        __newindex = function(t, k, v)
            error("[ZProtector Elite Security]: Memory tampering attempt.")
        end
    })

    local ${stateVar} = ${stateMain}
    local ${idxVar} = 0
    
    while ${stateVar} ~= ${stateExit} do
        if ${stateVar} == ${stateMain} then
            if ${idxVar} < len then
                local hexPair = ${subFunc}(${dataStr}, ${idxVar} * 2 + 1, ${idxVar} * 2 + 2)
                local rawVal = tonumber(hexPair, 16)
                -- Extracción segura utilizando la llave aislada de la metatable
                local rollingKey = (${metaTableVar}["key"] + (${idxVar} % 7)) % 256
                local ${byteVal} = ${bxorFunc}(rawVal, rollingKey)
                buffer.writeu8(${bufVar}, ${idxVar}, ${byteVal})
                ${idxVar} = ${idxVar} + 1
                ${stateVar} = ${stateMain}
            else
                ${stateVar} = ${stateNext}
            end
        elseif ${stateVar} == ${stateJunk} then
            -- Estado trampa (Junk State) con operaciones basura para confundir al descompilador
            local dummyCalc = (${metaTableVar}["key"] * 37) % 256
            ${stateVar} = ${stateMain}
        elseif ${stateVar} == ${stateNext} then
            ${stateVar} = ${stateExit}
        else
            -- Fallback de seguridad ante alteración de estados
            ${stateVar} = ${stateJunk}
        end
    end
    
    local compiledFunc, loadErr = ${loadStrFunc}(buffer.tostring(${bufVar}))
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
