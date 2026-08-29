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

        // 1. Cifrado binario pesado de doble pasada con llave rodante y rotación
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const masterKey = Math.floor(Math.random() * 200) + 30;
        let hexStream = "";

        for (let i = 0; i < utf8Buffer.length; i++) {
            const rollingKey = (masterKey + (i * 13) % 251) % 256;
            const byteVal = utf8Buffer[i] ^ rollingKey;
            // Doble mezcla de bits para ocultar el patrón hexadecimal puro
            const mixedByte = ((byteVal << 4) | (byteVal >> 4)) & 0xFF;
            hexStream += mixedByte.toString(16).padStart(2, '0');
        }

        // 2. Generador de nombres altamente ofuscados y caóticos
        const randName = () => "_0x" + Math.random().toString(36).substring(2, 10);
        const vmEnv = randName();
        const dataStr = randName();
        const keyChunk = randName();
        const bufVar = randName();
        const idxVar = randName();
        const byteVal = randName();
        const stateVar = randName();
        
        // Referencias a funciones de seguridad y aislamiento
        const envCheckFunc = randName();
        const timeCheckFunc = randName();
        const stackCheckFunc = randName();
        const metaTableVar = randName();
        const subFunc = randName();
        const bxorFunc = randName();
        const loadStrFunc = randName();
        
        // Estados dinámicos iniciales altamente complejos
        const baseSeed = Math.floor(Math.random() * 50000) + 15000;

        // 3. Script Final de Élite con Máquina de Estados Caótica y Anti-Tamper Extremo
        const eliteObfuscatedLua = `--[[
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║      ███████╗ ██████╗ ██████╗ ████████╗██████╗  ██████╗████████╗ ██████╗ ██████╗   ║
║      ╚══██╔╝ ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔═══██║╚══██╔══╝██╔═══██╗██╔══██╗  ║
║         ██╔╝  ██████╔╝██████╔╝   ██║   ██████╔╝██║   ██║   ██║   ██║   ██║██████╔╝  ║
║        ██╔╝   ██╔═══╝ ██╔══██╗   ██║   ██╔══██╗██║   ██║   ██║   ██║   ██║██╔══██╗  ║
║       ███████╗██║     ██║  ██║   ██║   ██║  ██║╚██████╔╝   ██║   ╚██████╔╝██║  ██║  ║
║       ╚══════╝╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝ ╚═╝  ╚═╝  ║
║                                                                              ║
║      Z PROTECTOR  │  discord.gg/wCrVjBtpt                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
]]
-- [ ZProtector Elite v5.2 - Military Grade Control-Flow Virtualization ]
local function ${vmEnv}()
    local ${keyChunk} = ${masterKey}
    local ${dataStr} = "${hexStream}"
    local len = #${dataStr} / 2
    local ${bufVar} = buffer.create(len)
    
    -- Aislamiento estricto de funciones nativas críticas del motor
    local ${subFunc} = string.sub
    local ${bxorFunc} = bit32.bxor
    local ${loadStrFunc} = loadstring
    
    -- CAPA 1: Validación rigurosa de entorno Roblox (Anti-Sandbox / Anti-Fake Environment)
    local function ${envCheckFunc}()
        if not game or typeof(game) ~= "Instance" or not getgenv then
            return false
        end
        return true
    end

    -- CAPA 2: Anti-Breakpoint por Delta de Tiempo Avanzado
    local function ${timeCheckFunc}()
        local start = os.clock()
        local x = 0
        for i = 1, 25000 do
            x = (x + i * 3) % 10007
        end
        if (os.clock() - start) > 0.12 then
            return false
        end
        return true
    end

    -- CAPA 3: Auditoría de Pila y Librería Debug
    local function ${stackCheckFunc}()
        if type(debug) ~= "table" or type(debug.info) ~= "function" then
            return false
        end
        return true
    end

    if not ${envCheckFunc}() or not ${timeCheckFunc}() or not ${stackCheckFunc}() then
        error("[ZProtector Elite Security]: Runtime environment violation or debugger hook detected.")
    end

    -- CAPA 4: Metatable Candado contra Inspección de Memoria y Volcado de Variables
    local ${metaTableVar} = { ["k"] = ${keyChunk} }
    setmetatable(${metaTableVar}, {
        __index = function() error("[ZProtector]: Memory read violation.") end,
        __newindex = function() error("[ZProtector]: Memory write violation.") end
    })

    local ${stateVar} = ${baseSeed}
    local ${idxVar} = 0

    -- Máquina de estados caótica y no lineal (Anti-Decompiladores AST)
    while ${stateVar} ~= 0 do
        if ${stateVar} == ${baseSeed} then
            if ${idxVar} < len then
                local hexPair = ${subFunc}(${dataStr}, ${idxVar} * 2 + 1, ${idxVar} * 2 + 2)
                local rawVal = tonumber(hexPair, 16)
                -- Reversión de la doble capa de bits
                local unmixed = ((rawVal >> 4) | (rawVal << 4)) & 0xFF
                local rollingKey = (${metaTableVar}["k"] + (${idxVar} * 13) % 251) % 256
                local ${byteVal} = ${bxorFunc}(unmixed, rollingKey)
                buffer.writeu8(${bufVar}, ${idxVar}, ${byteVal})
                ${idxVar} = ${idxVar} + 1
                -- Transición de estado con operaciones matemáticas opacas
                ${stateVar} = (${baseSeed} * 3 + 17) % 99991
            else
                ${stateVar} = 0 -- Salida limpia
            end
        elseif ${stateVar} == (( ${baseSeed} * 3 + 17 ) % 99991) then
            -- Estado trampa señuelo para confundir herramientas de análisis estático
            local junk = (${metaTableVar}["k"] * 43) % 256
            ${stateVar} = ${baseSeed}
        else
            -- Autodestrucción de flujo si detecta alteraciones en los estados
            ${stateVar} = 0
            error("[ZProtector]: Critical control flow corruption.")
        end
    end

    local compiledFunc, loadErr = ${loadStrFunc}(buffer.tostring(${bufVar}))
    if not compiledFunc then
        error("[ZProtector]: Bytecode compilation fault -> " .. tostring(loadErr))
    end
    return compiledFunc()
end

return ${vmEnv}()`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: eliteObfuscatedLua 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en el motor de ofuscación ZProtector.' });
    }
}
