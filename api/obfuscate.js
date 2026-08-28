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

        // Usar Base64 para empaquetar el código sin romper caracteres especiales ni saltos de línea
        const encodedCode = Buffer.from(code, 'utf-8').toString('base64');

        const randStr = () => "_0x" + Math.random().toString(36).substring(2, 8);
        const varB64 = randStr();
        const varDec = randStr();
        const varExec = randStr();
        const varErr = randStr();

        // Loader limpio compatible con executors de Roblox (Synapse/Kram/Delta/etc.)
        const obfuscatedLua = `-- [ ZProtector Secure Loader ]
local ${varB64} = "${encodedCode}"
local ${varDec} = syn and syn.crypt and syn.crypt.base64.decode(${varB64}) or (crypt and crypt.base64decode and crypt.base64decode(${varB64})) or select(2, pcall(function() return game:GetService("HttpService"):JSONDecode('"'..${varB64}..'"') end)) -- fallback o decodificador nativo
-- Si tu executor soporta base64 directamente:
local function b64decode(data)
    local b = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    data = string.gsub(data, '[^'..b..'=]', '')
    return (data:gsub('.', function(x)
        if (x == '=') then return '' end
        local r,f='',(b:find(x)-1)
        for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and '1' or '0') end
        return r;
    end):gsub('%d%d%d?%d?%d?%d?%d?%d?', function(x)
        if (#x ~= 8) then return '' end
        local c=0
        for i=1,8 do c=c+(x:sub(i,i)=='1' and 2^(8-i) or 0) end
        return string.char(c)
    end))
end

local ${varExec}, ${varErr} = loadstring(b64decode(${varB64}))
if ${varExec} then
    return ${varExec}()
else
    error("[ZProtector Error]: " .. tostring(${varErr}))
end`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: obfuscatedLua 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error al ofuscar el script.' });
    }
}
