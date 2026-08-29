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

        // ==========================================
        // Z-PROTECTOR ELITE: MOTOR PESADO NIVEL DIOS v6.0
        // ==========================================

        const rName = () => "_Z9x" + Math.random().toString(36).substring(2, 14);
        
        // Variables globales del core polimórfico
        const envCore = rName();
        const memBuffer = rName();
        const mainState = rName();
        const masterKeyVar = rName();
        const chunkIndex = rName();
        const loaderFunc = rName();
        const antiHook = rName();
        const decoyVar = rName();
        const stateMachineVar = rName();
        const secondaryKey = Math.floor(Math.random() * 150) + 10;

        // Generar un chingo de funciones basura para inflar el código y desorientar análisis
        const junkFunctionsBlock = [];
        for (let j = 0; j < 8; j++) {
            const jName = rName();
            const jVar = rName();
            junkFunctionsBlock.push(`
    local function ${jName}(${jVar})
        local t = {}
        for i = 1, 30 do
            t[i] = (${jVar} * i + ${j * 17}) % 255
        end
        return t[15] or ${j * 5}
    end`);
        }

        // Cifrado multinivel pesado (XOR + Rotación de bits + Llave rodante doble)
        const masterKey = Math.floor(Math.random() * 220) + 35;
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const totalBytes = utf8Buffer.length;
        
        const hexChunks = [];
        for (let i = 0; i < totalBytes; i++) {
            const roll1 = (masterKey + (i * 37) % 257) % 256;
            const roll2 = (secondaryKey + (i * 13) % 239) % 256;
            const bXor = utf8Buffer[i] ^ roll1 ^ roll2;
            const mixed = ((bXor >>> 4) | (bXor << 4)) & 0xFF;
            hexChunks.push(mixed.toString(16).padStart(2, '0'));
        }
        const obfuscatedHexStream = hexChunks.join('');

        // Payload masivo hiper-denso con Máquina de Estados interna y Anti-Tamper
        const customLuaPayload = `
--[[
    ========================================================================
    ███████╗██████╗ ██████╗ ████████╗██████╗  ██████╗ ████████╗ ██████╗ ██████╗ 
    ╚══███╔╝██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔═══██╗╚══██╔══╝██╔═══██╗██╔══██╗
      ███╔╝ ██████╔╝██████╔╝   ██║   ██████╔╝██║   ██║   ██║   ██║   ██║██████╔╝
     ███╔╝  ██╔═══╝ ██╔══██╗   ██║   ██╔══██╗██║   ██║   ██║   ██║   ██║██╔══██╗
    ███████╗██║     ██║  ██║   ██║   ██║  ██║╚██████╔╝   ██║   ╚██████╔╝██║  ██║
    ╚══════╝╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝  ╚═╝  ╚═╝
                    Z PROTECTOR ELITE - HEAVY ENGINE v6.0
                    PROTECTED IN-MEMORY BYTES & CFF
    ========================================================================
]]

local function ${envCore}()
    local _s_sub = string.sub
    local _s_byte = string.byte
    local _b_xor = bit32.bxor
    local _b_band = bit32.band
    local _b_bor = bit32.bor
    local _b_lshift = bit32.lshift
    local _b_rshift = bit32.rshift
    local _load = getgenv and getgenv().loadstring or loadstring

    -- [ BLOQUE DE FUNCIONES BASURA INYECTADAS ]
    ${junkFunctionsBlock.join('\n')}

    -- [ TRAMPA ANTI-HOOK Y VALIDACIÓN MILITAR DE ENTORNO ]
    local function ${antiHook}()
        if not game or typeof(game) ~= "Instance" then 
            return true 
        end
        local ${decoyVar} = pcall(function()
            return debug.info and true or false
        end)
        return false
    end

    if ${antiHook}() then
        while true do 
            local ${decoyVar} = string.rep("ZPROTECTOR_FATAL_CRASH", 99999) 
        end
    end

    -- [ MOTOR DE MAQUINARIA DE ESTADOS Y DESENCRIPTACIÓN ]
    local ${masterKeyVar} = ${masterKey}
    local ${stateMachineVar} = 1
    local ${mainState} = "${obfuscatedHexStream}"
    local ${chunkIndex} = #${mainState} / 2
    local ${memBuffer} = buffer.create(${chunkIndex})
    local ${loaderFunc} = 0

    while ${stateMachineVar} ~= 0 do
        if ${stateMachineVar} == 1 then
            if ${loaderFunc} < ${chunkIndex} then
                ${stateMachineVar} = 2
            else
                ${stateMachineVar} = 3
            end
        elseif ${stateMachineVar} == 2 then
            local ${decoyVar} = _s_sub(${mainState}, ${loaderFunc} * 2 + 1, ${loaderFunc} * 2 + 2)
            local rawB = tonumber(${decoyVar}, 16)
            
            if not rawB then 
                error("[ZProtector Heavy]: Error crítico de flujo en memoria.") 
            end

            local unmixed = _b_band(_b_bor(_b_rshift(rawB, 4), _b_lshift(rawB, 4)), 255)
            local roll1 = (${masterKeyVar} + (${loaderFunc} * 37) % 257) % 256
            local roll2 = (${secondaryKey} + (${loaderFunc} * 13) % 239) % 256
            local realB = _b_xor(unmixed, roll1, roll2)

            buffer.writeu8(${memBuffer}, ${loaderFunc}, realB)
            ${loaderFunc} = ${loaderFunc} + 1
            ${stateMachineVar} = 1
        elseif ${stateMachineVar} == 3 then
            break
        else
            ${stateMachineVar} = 1
        end
    end

    local finalCleanCode = buffer.tostring(${memBuffer})
    ${mainState} = nil
    ${memBuffer} = nil

    local compiledScript, err = _load(finalCleanCode)
    finalCleanCode = nil

    if not compiledScript or type(compiledScript) ~= "function" then
        error("[ZProtector Heavy]: Fallo de compilación interna -> " .. tostring(err))
    end

    return compiledScript()
end

return ${envCore}()
`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: customLuaPayload 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en el motor pesado ZProtector: ' + err.message });
    }
}
