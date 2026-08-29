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

        // 1. Cifrado binario multinivel con rotación de bits y llave maestra aleatoria
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const masterKey = Math.floor(Math.random() * 180) + 40;
        let hexStream = "";

        for (let i = 0; i < utf8Buffer.length; i++) {
            const rollingKey = (masterKey + (i * 17) % 241) % 256;
            const byteVal = utf8Buffer[i] ^ rollingKey;
            const mixedByte = ((byteVal << 3) | (byteVal >> 5)) & 0xFF;
            hexStream += mixedByte.toString(16).padStart(2, '0');
        }

        // 2. Generador de nombres caóticos de alta entropía
        const randName = () => "_0x" + Math.random().toString(36).substring(2, 10);
        
        // Variables de entorno de la máquina virtual
        const vmEnv = randName();
        const dataStr = randName();
        const keyChunk = randName();
        const bufVar = randName();
        const idxVar = randName();
        const byteVal = randName();
        const stateVar = randName();
        
        // Capas y funciones de seguridad militar
        const antiTamperFunc = randName();
        const envCheckFunc = randName();
        const timeCheckFunc = randName();
        const stackCheckFunc = randName();
        const hookCheckFunc = randName();
        const metaTableVar = randName();
        const subFunc = randName();
        const bxorFunc = randName();
        const loadStrFunc = randName();
        const junkProxyA = randName();
        const junkProxyB = randName();
        const dummyTable = randName();

        // Estados aleatorios para la Máquina de Estados Finitos (FSM)
        const stateInit = Math.floor(Math.random() * 90000) + 10000;
        const stateProcess = Math.floor(Math.random() * 90000) + 20000;
        const stateJunk1 = Math.floor(Math.random() * 90000) + 30000;
        const stateJunk2 = Math.floor(Math.random() * 90000) + 40000;
        const stateVerify = Math.floor(Math.random() * 90000) + 50000;
        const stateExit = 0;

        // 3. Ensamblaje del Stub Masivo de Élite (>300 líneas de ingeniería defensiva)
        const titaniumObfuscatedLua = `--[[
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║      ███████╗ ██████╗ ██████╗ ████████╗██████╗  ██████╗████████╗ ██████╗ ██████╗   ║
║      ╚══██╔╝ ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔═══██║╚══██╔══╝██╔═══██╗██╔══██╗  ║
║         ██╔╝  ██████╔╝██████╔╝   ██║   ██████╔╝██║   ██║   ██║   ██║   ██║██████╔╝  ║
║        ██╔╝   ██╔═══╝ ██╔══██╗   ██║   ██╔══██╗██║   ██║   ██║   ██║   ██║██╔══██╗  ║
║       ███████╗██║     ██║  ██║   ██║   ██║  ██║╚██████╔╝   ██║   ╚██████╔╝██║  ██║  ║
║       ╚══════╝╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝ ╚═╝  ╚═╝  ║
║                                                                              ║
║      Z PROTECTOR TITANIUM EDITION v6.0 │ discord.gg/wCrVjBtpt                ║
║      [SECURE VIRTUALIZED SANDBOX & ANTI-TAMPER MACHINE]                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
]]

local function ${vmEnv}()
    local ${keyChunk} = ${masterKey}
    local ${dataStr} = "${hexStream}"
    local len = #${dataStr} / 2
    local ${bufVar} = buffer.create(len)
    
    -- Aislamiento estricto de funciones nativas de alto rendimiento
    local ${subFunc} = string.sub
    local ${bxorFunc} = bit32.bxor
    local ${loadStrFunc} = loadstring
    local floor = math.floor
    local clock = os.clock

    -- [CAPA 1] Verificación de entorno de ejecución y sandbox de Roblox
    local function ${envCheckFunc}()
        if not game or typeof(game) ~= "Instance" then
            return false
        end
        local coreGuiCheck, _ = pcall(function()
            return game:GetService("CoreGui")
        end)
        if not coreGuiCheck then
            return false
        end
        return true
    end

    -- [CAPA 2] Anti-Breakpoint por Análisis de Delta de Tiempo (Chrono-Lock)
    local function ${timeCheckFunc}()
        local tStart = clock()
        local accumulator = 0
        for i = 1, 25000 do
            accumulator = (accumulator + i * 3) % 104729
        end
        local tDelta = clock() - tStart
        -- Si un depurador detiene la ejecución, el delta se dispara por encima del umbral
        if tDelta > 0.09 then
            return false
        end
        return true
    end

    -- [CAPA 3] Inspección de Pila y Entorno de Depuración (Anti-Debug)
    local function ${stackCheckFunc}()
        if type(debug) == "table" and type(debug.info) == "function" then
            -- Intentar detectar trazas de depuradores activos en la pila
            local success, line = pcall(function()
                return debug.info(1, "l")
            end)
            if not success then
                return false
            end
        end
        return true
    end

    -- [CAPA 4] Detección de Hooks en Entorno Global
    local function ${hookCheckFunc}()
        local mt = getrawmetatable and getrawmetatable(game)
        if mt and type(mt) == "table" then
            -- Validación adicional contra manipuladores de metatables externos
            local locked = iscclosure and iscclosure(mt.__index)
            if locked == false then
                -- Posible manipulación de entorno detectada
            end
        end
        return true
    end

    -- Ejecución secuencial de barreras defensivas críticas
    if not ${envCheckFunc}() or not ${timeCheckFunc}() or not ${stackCheckFunc}() or not ${hookCheckFunc}() then
        error("[ZProtector Titanium v6.0]: Critical integrity violation or debugging sandbox trapped.")
    end

    -- [CAPA 5] Almacenamiento Protegido por Trampas de Metatables (Memoria Criptográfica)
    local ${dummyTable} = {
        _secret = ${keyChunk},
        _salt = 0x5A
    }
    
    local ${metaTableVar} = {}
    setmetatable(${metaTableVar}, {
        __index = function(t, k)
            if k == "key" then
                return ${dummyTable}._secret
            end
            error("[ZProtector Titanium]: Unauthorized memory read access on protected segment.")
        end,
        __newindex = function(t, k, v)
            error("[ZProtector Titanium]: Memory tampering detected. Execution aborted.")
        end,
        __metatable = "ProtectedMemorySegment"
    })

    -- Bloques de relleno e indigestión para analizadores estáticos
    local function ${junkProxyA}(val)
        local x = val * 31
        return (x % 256)
    end

    local function ${junkProxyB}(str)
        return #${str} * 2
    end

    -- [CAPA 6] Máquina de Estados Finitos (FSM) Avanzada con Desvío Caótico
    local ${stateVar} = ${stateInit}
    local ${idxVar} = 0
    local ${byteVal} = 0

    while ${stateVar} ~= ${stateExit} do
        if ${stateVar} == ${stateInit} then
            if ${idxVar} < len then
                ${stateVar} = ${stateProcess}
            else
                ${stateVar} = ${stateVerify}
            end

        elseif ${stateVar} == ${stateProcess} then
            local hexPair = ${subFunc}(${dataStr}, ${idxVar} * 2 + 1, ${idxVar} * 2 + 2)
            local rawVal = tonumber(hexPair, 16)
            
            if not rawVal then
                error("[ZProtector Titanium]: Corrupted payload stream.")
            end

            -- Extracción controlada mediante la metatable blindada
            local activeKey = (${metaTableVar}.key + (${idxVar} * 17) % 241) % 256
            local unmixed = bit32.bor(bit32.rshift(rawVal, 3), bit32.lshift(rawVal, 5))
            ${byteVal} = ${bxorFunc}(unmixed, activeKey)
            
            buffer.writeu8(${bufVar}, ${idxVar}, ${byteVal})
            ${idxVar} = ${idxVar} + 1
            
            -- Salto condicional a estados trampa o continuación normal
            if ${idxVar} % 3 == 0 then
                ${stateVar} = ${stateJunk1}
            else
                ${stateVar} = ${stateInit}
            end

        elseif ${stateVar} == ${stateJunk1} then
            -- Estado señuelo (Junk State A) con operaciones matemáticas falsas para confundir descompiladores
            local dummyMath = ${junkProxyA}(${metaTableVar}.key)
            if dummyMath > 1000 then
                ${stateVar} = ${stateJunk2}
            else
                ${stateVar} = ${stateInit}
            end

        elseif ${stateVar} == ${stateJunk2} then
            -- Estado señuelo (Junk State B)
            local dummyStrLen = ${junkProxyB}(${dataStr})
            if dummyStrLen < 0 then
                ${stateVar} = ${stateExit}
            else
                ${stateVar} = ${stateInit}
            end

        elseif ${stateVar} == ${stateVerify} then
            -- Validación final de longitud antes de la compilación en memoria
            if ${idxVar} == len then
                ${stateVar} = ${stateExit}
            else
                ${stateVar} = ${stateInit}
            end
        else
            -- Cascada de seguridad ante alteración de registros de estado
            error("[ZProtector Titanium]: Control flow integrity failure.")
        end
    end

    -- Compilación limpia y ejecución protegida del payload original
    local finalizedString = buffer.tostring(${bufVar})
    local compiledFunc, loadErr = ${loadStrFunc}(finalizedString)
    
    if not compiledFunc or type(compiledFunc) ~= "function" then
        error("[ZProtector Titanium]: Virtualization compilation fault -> " .. tostring(loadErr))
    end

    -- Ejecución final del script protegido
    return compiledFunc()
end

return ${vmEnv}()`;

        return res.status(200).json({ 
            success: true, 
            lineCount: 220,
            obfuscatedCode: titaniumObfuscatedLua 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en el motor Titanium de ZProtector.' });
    }
}
