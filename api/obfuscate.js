export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb',
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

        // 1. Cifrado binario pesado optimizado en memoria O(N)
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const masterKey = Math.floor(Math.random() * 200) + 30;
        const hexChunks = new Array(utf8Buffer.length);

        for (let i = 0; i < utf8Buffer.length; i++) {
            const rollingKey = (masterKey + (i * 23) % 251) % 256;
            const byteVal = utf8Buffer[i] ^ rollingKey;
            const mixedByte = ((byteVal >>> 4) | (byteVal << 4)) & 0xFF;
            hexChunks[i] = mixedByte.toString(16).padStart(2, '0');
        }
        const hexStream = hexChunks.join('');

        // 2. Generador masivo de identificadores caóticos y extraños
        const randName = () => "_0x" + Math.random().toString(36).substring(2, 10);
        
        const vmEnv = randName();
        const dataStr = randName();
        const keyVal = randName();
        const bufVar = randName();
        const idxVar = randName();
        const byteVal = randName();
        const stateVar = randName();
        
        const subFunc = randName();
        const bxorFunc = randName();
        const bandFunc = randName();
        const loadFunc = randName();
        const clockFunc = randName();
        const lenVar = randName();
        const hexPairVar = randName();
        const rawByteVar = randName();
        const unmixedVar = randName();
        const currentKeyVar = randName();
        const cleanupVar = randName();
        const compiledVar = randName();
        const errVar = randName();
        const checkEnv = randName();
        const dummyTable = randName();

        // Estados dinámicos matemáticos aleatorios para que cada ofuscación luzzca única y rara
        const baseSeed = Math.floor(Math.random() * 50000) + 15000;
        const stateInit = baseSeed + 1337;
        const stateProcess = baseSeed + 8842;
        const stateTrap = baseSeed + 19992;
        const stateDone = 0;

        // 3. Stub ultra-ofuscado, denso y 100% compatible con ejecutores
        const chaoticObfuscatedLua = `--[[
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
    local ${clockFunc} = os.clock

    local function ${checkEnv}()
        if not game or typeof(game) ~= "Instance" then return false end
        return true
    end

    if not ${checkEnv}() then
        error("[ZProtector]: Sandbox violation.")
    end

    local ${dataStr} = "${hexStream}"
    local ${keyVal} = ${masterKey}
    local ${lenVar} = #${dataStr} / 2
    local ${bufVar} = buffer.create(${lenVar})

    local ${stateVar} = ${stateInit}
    local ${idxVar} = 0

    while ${stateVar} ~= ${stateDone} do
        if ${stateVar} == ${stateInit} then
            if ${idxVar} < ${lenVar} then
                ${stateVar} = ${stateProcess}
            else
                ${stateVar} = ${stateDone}
            end
        elseif ${stateVar} == ${stateProcess} then
            local ${hexPairVar} = ${subFunc}(${dataStr}, ${idxVar} * 2 + 1, ${idxVar} * 2 + 2)
            local ${rawByteVar} = tonumber(${hexPairVar}, 16)
            if not ${rawByteVar} then error("[ZProtector]: Decryption fault.") end

            local ${unmixedVar} = ${bandFunc}(bit32.bor(bit32.rshift(${rawByteVar}, 4), bit32.lshift(${rawByteVar}, 4)), 255)
            local ${currentKeyVar} = (${keyVal} + (${idxVar} * 23) % 251) % 256
            local ${byteVal} = ${bxorFunc}(${unmixedVar}, ${currentKeyVar})

            buffer.writeu8(${bufVar}, ${idxVar}, ${byteVal})
            ${idxVar} = ${idxVar} + 1

            if ${idxVar} % 16 == 0 and ${idxVar} < ${lenVar} then
                ${stateVar} = ${stateTrap}
            else
                ${stateVar} = ${stateInit}
            end
        elseif ${stateVar} == ${stateTrap} then
            if ${idxVar} < 0 then 
                ${stateVar} = ${stateDone} 
            else 
                ${stateVar} = ${stateInit} 
            end
        else
            error("[ZProtector]: Flow integrity check failed.")
        end
    end

    local ${cleanupVar} = buffer.tostring(${bufVar})
    ${dataStr} = nil
    ${bufVar} = nil

    local ${compiledVar}, ${errVar} = ${loadFunc}(${cleanupVar})
    ${cleanupVar} = nil

    if not ${compiledVar} or type(${compiledVar}) ~= "function" then
        error("[ZProtector]: Execution error -> " .. tostring(${errVar}))
    end

    return ${compiledVar}()
end

return ${vmEnv}()`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: chaoticObfuscatedLua 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error en el motor ZProtector: ' + err.message });
    }
}
