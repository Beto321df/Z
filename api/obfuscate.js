export default async function handler(req, res) {
    // Permitir llamados POST desde tu panel web
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

        // 1. Convertir el código Lua a un arreglo de bytes con XOR Key (0x5A)
        const bytes = Array.from(Buffer.from(code, 'utf-8')).map(b => b ^ 0x5A);
        const byteString = bytes.join(',');

        // 2. Generar nombres de variables aleatorios estilo Heavy VM
        const randStr = () => "_0x" + Math.random().toString(36).substring(2, 8);
        const varKey = randStr();
        const varByte = randStr();
        const varRes = randStr();
        const varVM = randStr();
        const varExec = randStr();
        const varErr = randStr();

        // 3. Estructura de VM Luau blindada contra valores nulos
        const obfuscatedLua = `-- [ ZProtector B010 Heavy Obfuscator ]
local ${varKey} = 90
local ${varByte} = {${byteString}}
local ${varRes} = {}
for i = 1, #${varByte} do
    local b = bit32.bxor(${varByte}[i], ${varKey})
    local char = string.char(b)
    if char then
        table.insert(${varRes}, char)
    end
end
local ${varVM} = table.concat(${varRes})
local ${varExec}, ${varErr} = loadstring(${varVM})
if ${varExec} then
    return ${varExec}()
else
    error("[ZProtector Heavy VM Error]: " .. tostring(${varErr}))
end`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: obfuscatedLua 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error al ofuscar el script.' });
    }
}
