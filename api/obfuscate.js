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

        // 1. Cifrado binario pesado con funciones nativas de bits
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const masterKey = Math.floor(Math.random() * 200) + 30;
        let hexStream = "";

        for (let i = 0; i < utf8Buffer.length; i++) {
            const rollingKey = (masterKey + (i * 13) % 251) % 256;
            const byteVal = utf8Buffer[i] ^ rollingKey;
            // Simulación de mezcla con funciones shift de 32 bits
            const mixedByte = ((byteVal >>> 4) | (byteVal << 4)) & 0xFF;
            hexStream += mixedByte.toString(16).padStart(2, '0');
        }

        // 2. Generador de nombres caóticos ultracortos
        const randName = () => "_0x" + Math.random().toString(36).substring(2, 7);
        const bVar = randName();
        const sVar = randName();
        const fVar = randName();
        const dVar = randName();
        const kVar = randName();
        const pVar = randName();
        const iVar = randName();
        const xVar = randName();
        const hData = randName();

        // 3. Stub Ultra-Compacto de Élite corregido para Luau nativo
        const ultraCompactLua = `--[[
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
-- [ ZProtector Ultra-Compact Elite v5.4 ]
local ${bVar}, ${sVar}, ${fVar}, ${hData} = buffer, string, loadstring, "${hexStream}"
assert(game and typeof(game) == "Instance", "[ZProtector]: Sandbox violation.")
local ${dVar}, ${kVar}, ${pVar} = ${bVar}.create(#${hData}/2), ${masterKey}, 0
for ${iVar} = 1, #${hData}, 2 do
    local ${xVar} = tonumber(${sVar}.sub(${hData}, ${iVar}, ${iVar}+1), 16)
    local unmixed = bit32.band(bit32.bor(bit32.rshift(${xVar}, 4), bit32.lshift(${xVar}, 4)), 255)
    local finalByte = bit32.bxor(unmixed, (${kVar} + (${pVar} * 13) % 251) % 256)
    ${bVar}.writeu8(${dVar}, ${pVar}, finalByte)
    ${pVar} = ${pVar} + 1
end
return ${fVar}(${bVar}.tostring(${dVar}))()`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: ultraCompactLua 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en el motor ZProtector.' });
    }
}
