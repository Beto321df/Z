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

        // 1. Cifrado binario
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const masterKey = Math.floor(Math.random() * 200) + 30;
        const hexChunks = new Array(utf8Buffer.length);

        for (let i = 0; i < utf8Buffer.length; i++) {
            const rollingKey = (masterKey + (i * 23) % 251) % 256;
            const byteVal = utf8Buffer[i] ^ rollingKey;
            // Mezclamos los nibbles (mitades de byte)
            const mixedByte = ((byteVal >>> 4) | (byteVal << 4)) & 0xFF;
            hexChunks[i] = mixedByte.toString(16).padStart(2, '0');
        }
        const hexStream = hexChunks.join('');

        // 2. Generador de Variables de Ilusión Óptica (l, I, 1)
        // Esto hace que el código sea casi imposible de leer visualmente
        const randIllusion = () => {
            const chars = ['l', 'I', '1'];
            let str = chars[1]; // Siempre empieza con I para evitar errores de sintaxis
            for(let i = 0; i < 7; i++) str += chars[Math.floor(Math.random() * chars.length)];
            return str;
        };
        
        const vKey = randIllusion();
        const vData = randIllusion();
        const vBuf = randIllusion();
        const vXor = randIllusion();
        const vI = randIllusion();
        const vByte = randIllusion();
        const vFunc = randIllusion();
        const vErr = randIllusion();

        // 3. Stub Extremadamente Compacto y Matemático
        // Reducimos las 40 líneas a una función anónima densa de 9 líneas
        const compactObfuscatedLua = `--[[ Z PROTECTOR | COMPACT CORE ]]
return (function(${vKey}, ${vData})
    if not game then return end
    local ${vBuf}, ${vXor} = buffer.create(#${vData}/2), bit32.bxor
    for ${vI} = 0, #${vData}/2 - 1 do
        local ${vByte} = tonumber(string.sub(${vData}, ${vI}*2+1, ${vI}*2+2), 16)
        buffer.writeu8(${vBuf}, ${vI}, ${vXor}((((${vByte}/16)-(${vByte}/16)%1)+(${vByte}%16)*16), (${vKey} + (${vI} * 23) % 251) % 256))
    end
    local ${vFunc}, ${vErr} = loadstring(buffer.tostring(${vBuf}))
    ${vBuf}, ${vData} = nil, nil
    return ${vFunc} and ${vFunc}() or error("[ZProtector]: " .. tostring(${vErr}))
end)(${masterKey}, "${hexStream}")`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: compactObfuscatedLua 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error en el motor ZProtector: ' + err.message });
    }
}
