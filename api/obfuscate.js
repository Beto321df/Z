export const config = {
    api: {
        bodyParser: { sizeLimit: '4mb' },
    },
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    try {
        const { code } = req.body;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Debes proporcionar un código Lua válido.' });
        }

        // 1. Cifrado Binario Mutante (Más pesado que el original)
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const masterKey = Math.floor(Math.random() * 200) + 30;
        const hexChunks = new Array(utf8Buffer.length);

        for (let i = 0; i < utf8Buffer.length; i++) {
            const rollingKey = (masterKey + (i * 17) % 251) % 256;
            const byteVal = utf8Buffer[i] ^ rollingKey;
            const mixedByte = ((byteVal >>> 3) | (byteVal << 5)) & 0xFF; // Rotación de bits alterada
            hexChunks[i] = mixedByte.toString(16).padStart(2, '0');
        }
        const hexStream = hexChunks.join('');

        // 2. Generador de nombres polimórficos
        const randName = () => "_Z" + Math.random().toString(36).substring(2, 12);
        
        const envFunc = randName();
        const dataStr = randName();
        const bufVar = randName();
        const hookCheck = randName();
        const decoyVar = randName();
        const crashVar = randName();
        const realLoad = randName();

        // 3. Stub Lua con Anti-Tamper Militar Inyectado
        const chaoticObfuscatedLua = `--[[ Z PROTECTOR ELITE | ANTI-DUMP V2 ]]
local function ${envFunc}()
    local ${realLoad} = getgenv and getgenv().loadstring or loadstring
    local ${hookCheck} = false
    
    -- [1] TRAMPA ANTI-HOOK (Detecta si están espiando el loadstring)
    if iscclosure and iscclosure(${realLoad}) then ${hookCheck} = true end
    if hookfunction then 
        local s, e = pcall(function() hookfunction(${realLoad}, function() end) end)
        if s then ${hookCheck} = true end
    end

    -- [2] EL SEÑUELO (Manda basura al dumper para engañarlo)
    local ${decoyVar} = "print('ZProtector: Intento de dump bloqueado. Te la pelaste perro.')"
    pcall(function() ${realLoad}(${decoyVar})() end)

    -- [3] BOMBA DE MEMORIA (Si detecta dumper, crashea el juego del wey)
    if ${hookCheck} then
        while true do
            print("Crasheando...")
            string.rep("Z", 9999999) -- Revienta la RAM del ejecutor
        end
    end

    -- [4] DESCIFRADO LEGÍTIMO (Solo si el entorno está limpio)
    local ${dataStr} = "${hexStream}"
    local ${bufVar} = buffer.create(#${dataStr} / 2)
    local mk = ${masterKey}
    local idx = 0

    for i = 1, #${dataStr}, 2 do
        local hex = string.sub(${dataStr}, i, i + 1)
        local rawByte = tonumber(hex, 16)
        
        -- Revertir rotación de bits (>> 5 y << 3)
        local unmixed = bit32.band(bit32.bor(bit32.lshift(rawByte, 3), bit32.rshift(rawByte, 5)), 255)
        local currentKey = (mk + (idx * 17) % 251) % 256
        local realByte = bit32.bxor(unmixed, currentKey)
        
        buffer.writeu8(${bufVar}, idx, realByte)
        idx = idx + 1
    end

    local finalCode = buffer.tostring(${bufVar})
    ${dataStr} = nil -- Limpiar memoria
    ${bufVar} = nil
    
    local exec, err = ${realLoad}(finalCode)
    if not exec then return end
    
    return exec()
end

return ${envFunc}()`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: chaoticObfuscatedLua 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en ZProtector: ' + err.message });
    }
}
