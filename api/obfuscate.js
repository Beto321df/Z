export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb', // Ampliamos el límite para soportar scripts gigantes de más de 3,000 líneas
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

        // 1. Cifrado optimizado con array chunks para evitar saturación en scripts masivos
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const masterKey = Math.floor(Math.random() * 180) + 40;
        const hexChunks = new Array(utf8Buffer.length);

        for (let i = 0; i < utf8Buffer.length; i++) {
            const rollingKey = (masterKey + (i * 17) % 241) % 256;
            const byteVal = utf8Buffer[i] ^ rollingKey;
            const mixedByte = ((byteVal << 3) | (byteVal >> 5)) & 0xFF;
            hexChunks[i] = mixedByte.toString(16).padStart(2, '0');
        }
        const hexStream = hexChunks.join('');

        // 2. Generador de nombres caóticos de alta entropía
        const randName = () => "_0x" + Math.random().toString(36).substring(2, 10);
        
        const vmEnv = randName();
        const dataStr = randName();
        const keyChunk = randName();
        const bufVar = randName();
        const idxVar = randName();
        const byteVal = randName();
        const stateVar = randName();
        
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

        const stateInit = Math.floor(Math.random() * 90000) + 10000;
        const stateProcess = Math.floor(Math.random() * 90000) + 20000;
        const stateJunk1 = Math.floor(Math.random() * 90000) + 30000;
        const stateJunk2 = Math.floor(Math.random() * 90000) + 40000;
        const stateVerify = Math.floor(Math.random() * 90000) + 50000;
        const stateExit = 0;

        // 3. Ensamblaje del Stub Masivo de Élite con sintaxis 100% nativa de Luau
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
║      Z PROTECTOR TITANIUM EDITION v6.2 │ discord.gg/wCrVjBtpt                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
]]

local function ${vmEnv}()
    local ${keyChunk} = ${masterKey}
    local ${dataStr} = "${hexStream}"
    local len = #${dataStr} / 2
    local ${bufVar} = buffer.create(len)
    
    local ${subFunc} = string.sub
    local ${bxorFunc} = bit32.bxor
    local ${loadStrFunc} = loadstring
    local clock = os.clock

    local function ${envCheckFunc}()
        if not game or typeof(game) ~= "Instance" then return false end
        local ok, _ = pcall(function() return game:GetService("CoreGui") end)
        return ok
    end

    local function ${timeCheckFunc}()
        local tStart = clock()
        local acc = 0
        for i = 1, 20000 do acc = (acc + i * 3) % 104729 end
        if (clock() - tStart) > 0.15 then return false end
        return true
    end

    local function ${stackCheckFunc}()
        if type(debug) == "table" and type(debug.info) == "function" then
            local ok, _ = pcall(function() return debug.info(1, "l") end)
            if not ok then return false end
        end
        return true
    end

    local function ${hookCheckFunc}()
        return true
    end

    if not ${envCheckFunc}() or not ${timeCheckFunc}() or not ${stackCheckFunc}() or not ${hookCheckFunc}() then
        error("[ZProtector Titanium]: Critical integrity violation.")
    end

    local ${dummyTable} = { _secret = ${keyChunk} }
    local ${metaTableVar} = {}
    setmetatable(${metaTableVar}, {
        __index = function(t, k)
            if k == "key" then return ${dummyTable}._secret end
            error("[ZProtector Titanium]: Unauthorized memory read.")
        end,
        __newindex = function(t, k, v)
            error("[ZProtector Titanium]: Memory tampering.")
        end,
        __metatable = "Locked"
    })

    local function ${junkProxyA}(v) return (v * 31) % 256 end
    local function ${junkProxyB}(s) return #${s} * 2 end

    local ${stateVar} = ${stateInit}
    local ${idxVar} = 0
    local ${byteVal} = 0

    while ${stateVar} ~= ${stateExit} do
        if ${stateVar} == ${stateInit} then
            if ${idxVar} < len then ${stateVar} = ${stateProcess} else ${stateVar} = ${stateVerify} end
        elseif ${stateVar} == ${stateProcess} then
            local hexPair = ${subFunc}(${dataStr}, ${idxVar} * 2 + 1, ${idxVar} * 2 + 2)
            local rawVal = tonumber(hexPair, 16)
            if not rawVal then error("[ZProtector Titanium]: Corrupted stream.") end

            local activeKey = (${metaTableVar}.key + (${idxVar} * 17) % 241) % 256
            local unmixed = bit32.bor(bit32.rshift(rawVal, 3), bit32.lshift(rawVal, 5))
            ${byteVal} = ${bxorFunc}(unmixed, activeKey)
            
            buffer.writeu8(${bufVar}, ${idxVar}, ${byteVal})
            ${idxVar} = ${idxVar} + 1
            
            if ${idxVar} % 4 == 0 then ${stateVar} = ${stateJunk1} else ${stateVar} = ${stateInit} end
        elseif ${stateVar} == ${stateJunk1} then
            local dummy = ${junkProxyA}(${metaTableVar}.key)
            if dummy > 1000 then
                ${stateVar} = ${stateJunk2}
            else
                ${stateVar} = ${stateInit}
            end
        elseif ${stateVar} == ${stateJunk2} then
            local dummyLen = ${junkProxyB}(${dataStr})
            if dummyLen < 0 then
                ${stateVar} = ${stateExit}
            else
                ${stateVar} = ${stateInit}
            end
        elseif ${stateVar} == ${stateVerify} then
            if ${idxVar} == len then ${stateVar} = ${stateExit} else ${stateVar} = ${stateInit} end
        else
            error("[ZProtector Titanium]: Flow error.")
        end
    end

    local compiledFunc, loadErr = ${loadStrFunc}(buffer.tostring(${bufVar}))
    if not compiledFunc or type(compiledFunc) ~= "function" then
        error("[ZProtector Titanium]: Load error -> " .. tostring(loadErr))
    end
    return compiledFunc()
end

return ${vmEnv}()`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: titaniumObfuscatedLua 
        });

    } catch (err) {
        // Ahora el servidor devuelve exactamente el error real para depurarlo al instante
        return res.status(500).json({ error: 'Error en el motor Titanium: ' + err.message });
    }
}
