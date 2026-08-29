export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb', // Soporta scripts masivos de hasta 3,000+ líneas sin tirar Error 500
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

        // 1. Cifrado binario en chunks optimizado en memoria O(N)
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const masterKey = Math.floor(Math.random() * 190) + 35;
        const hexChunks = new Array(utf8Buffer.length);

        for (let i = 0; i < utf8Buffer.length; i++) {
            const rollingKey = (masterKey + (i * 19) % 251) % 256;
            const byteVal = utf8Buffer[i] ^ rollingKey;
            const mixedByte = ((byteVal >>> 4) | (byteVal << 4)) & 0xFF;
            hexChunks[i] = mixedByte.toString(16).padStart(2, '0');
        }
        const hexStream = hexChunks.join('');

        // 2. Generador de identificadores aleatorios de alta entropía
        const randName = () => "_0x" + Math.random().toString(36).substring(2, 9);
        
        const vmEnv = randName();
        const dataStr = randName();
        const keyVal = randName();
        const bufVar = randName();
        const idxVar = randName();
        const byteVal = randName();
        const stateVar = randName();
        
        const checkEnv = randName();
        const checkHooks = randName();
        const checkTiming = randName();
        const cleanupVar = randName();

        const subFunc = randName();
        const bxorFunc = randName();
        const bandFunc = randName();
        const loadFunc = randName();

        const stateInit = Math.floor(Math.random() * 80000) + 10000;
        const stateProcess = Math.floor(Math.random() * 80000) + 20000;
        const stateTrap = Math.floor(Math.random() * 80000) + 30000;
        const stateDone = 0;

        // 3. Stub blindado con anti-dumping, anti-hooks y banner visual corregido
        const titaniumObfuscatedLua = `--[[
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗    ██████╗ ██████╗  ██████╗ ████████╗██████╗  ██████╗ ████████╗   ║
║   ╚══███╔╝    ██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██╔══██╗██╔═══██╗██╔═══██╗   ║
║     ███╔╝     ██████╔╝██████╔╝██║   ██║   ██║   ██████╔╝██║   ██║██████╔╝    ║
║    ███╔╝      ██╔═══╝ ██╔══██╗██║   ██║   ██║   ██╔══██╗██║   ██║██╔══██╗    ║
║   ███████╗    ██║     ██║  ██║╚██████╔╝   ██║   ██║  ██║╚██████╔╝██║  ██║    ║
║   ╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝    ║
║                                                                              ║
║               Z PROTECTOR  │  discord.gg/wCrVjBtpt                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
]]

local function ${vmEnv}()
    local ${subFunc} = string.sub
    local ${bxorFunc} = bit32.bxor
    local ${bandFunc} = bit32.band
    local ${loadFunc} = loadstring
    local clock = os.clock

    -- Detección de Hooks / Anti-Extraction
    local function ${checkHooks}()
        local isHooked = false
        pcall(function()
            if tostring(${loadFunc}):find("custom") or tostring(${subFunc}):find("hook") then
                isHooked = true
            end
            if type(hookfunction) == "function" or type(isourclosure) == "function" then
                if isourclosure(${loadFunc}) or isourclosure(${subFunc}) then 
                    isHooked = true 
                end
            end
        end)
        return not isHooked
    end

    -- Anti-Breakpoint / Timing Verification
    local function ${checkTiming}()
        local tStart = clock()
        local acc = 0
        for i = 1, 30000 do acc = (acc + i * 7) % 65535 end
        if (clock() - tStart) > 0.10 then return false end
        return true
    end

    -- Sandbox Integrity
    local function ${checkEnv}()
        if not game or typeof(game) ~= "Instance" then return false end
        local isOk, _ = pcall(function() return game:GetService("CoreGui") end)
        return isOk
    end

    if not ${checkEnv}() or not ${checkHooks}() or not ${checkTiming}() then
        error("[ZProtector]: Security integrity violation.")
    end

    local ${dataStr} = "${hexStream}"
    local ${keyVal} = ${masterKey}
    local totalLen = #${dataStr} / 2
    local ${bufVar} = buffer.create(totalLen)

    local ${stateVar} = ${stateInit}
    local ${idxVar} = 0

    while ${stateVar} ~= ${stateDone} do
        if ${stateVar} == ${stateInit} then
            if ${idxVar} < totalLen then
                ${stateVar} = ${stateProcess}
            else
                ${stateVar} = ${stateDone}
            end
        elseif ${stateVar} == ${stateProcess} then
            local hexPair = ${subFunc}(${dataStr}, ${idxVar} * 2 + 1, ${idxVar} * 2 + 2)
            local rawByte = tonumber(hexPair, 16)
            if not rawByte then error("[ZProtector]: Decryption fault.") end

            local unmixed = ${bandFunc}(bit32.bor(bit32.rshift(rawByte, 4), bit32.lshift(rawByte, 4)), 255)
            local currentKey = (${keyVal} + (${idxVar} * 19) % 251) % 256
            local ${byteVal} = ${bxorFunc}(unmixed, currentKey)

            buffer.writeu8(${bufVar}, ${idxVar}, ${byteVal})
            ${idxVar} = ${idxVar} + 1

            if ${idxVar} % 16 == 0 and ${idxVar} < totalLen then
                ${stateVar} = ${stateTrap}
            else
                ${stateVar} = ${stateInit}
            end
        elseif ${stateVar} == ${stateTrap} then
            if ${idxVar} < 0 then ${stateVar} = ${stateDone} else ${stateVar} = ${stateInit} end
        else
            error("[ZProtector]: Flow integrity check failed.")
        end
    end

    -- Anti-Dump Memory Wipe (Limpia los datos binarios antes de pasar a la memoria de ejecución)
    local ${cleanupVar} = buffer.tostring(${bufVar})
    ${dataStr} = nil
    ${bufVar} = nil

    local compiledScript, loadErr = ${loadFunc}(${cleanupVar})
    ${cleanupVar} = nil

    if not compiledScript or type(compiledScript) ~= "function" then
        error("[ZProtector]: Execution error -> " .. tostring(loadErr))
    end

    return compiledScript()
end

return ${vmEnv}()`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: titaniumObfuscatedLua 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error en el motor ZProtector: ' + err.message });
    }
}
