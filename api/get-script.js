export default async function handler(req, res) {
    const { id } = req.query;
    const accept = (req.headers['accept'] || '').toLowerCase();
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const isSecHeader = !!req.headers['sec-ch-ua'];

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // 1. Detección de navegadores y bots
    const isBrowser = isSecHeader || accept.includes('text/html');
    const isBot = ua.includes('discord') || ua.includes('python') || 
                  ua.includes('axios') || ua.includes('node') || 
                  ua.includes('curl') || ua.includes('wget') || 
                  ua.includes('go-http-client') || ua.includes('java') ||
                  ua.includes('bot') || ua.includes('crawler');

    if (isBrowser || isBot) {
        return res.status(403).send(`-- ====================================================\n-- 🚫 ACCESO DENEGADO\n-- Este script solo se ejecuta desde Roblox.\n-- ====================================================`);
    }

    if (!id) {
        return res.status(400).send("-- print('Error: ID no proporcionado.')");
    }

    try {
        const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, "");
        const DB_URL = "https://loaderz1-default-rtdb.firebaseio.com";
        const SECRET = process.env.FIREBASE_SECRET;

        // Petición a Firebase
        const fbRes = await fetch(`${DB_URL}/scripts/${cleanId}.json?auth=${SECRET}`);
        const data = await fbRes.json();

        if (!data || data.error) {
            return res.status(404).send("-- print('Error: Script no encontrado en Firebase.')");
        }

        // Obtener el código Lua del objeto guardado
        const rawCode = typeof data === 'string' ? data : (data.code || data.content || data.script || data);

        if (typeof rawCode !== 'string') {
            return res.status(404).send("-- print('Error: El formato almacenado en Firebase no es válido.')");
        }

        // Codificación Base64 limpia en el servidor
        const encodedCode = Buffer.from(rawCode, 'utf-8').toString('base64');

        // Decodificador Luau seguro
        const protectedLuau = `local _b = "${encodedCode}"
local function _d(data)
    local b = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    local chars = {}
    for i = 1, #b do chars[b:sub(i,i)] = i - 1 end
    data = data:gsub('[^'..b..'=]', '')
    local out = {}
    for i = 1, #data, 4 do
        local c1, c2, c3, c4 = data:sub(i,i), data:sub(i+1,i+1), data:sub(i+2,i+2), data:sub(i+3,i+3)
        local v1, v2 = chars[c1] or 0, chars[c2] or 0
        local v3, v4 = chars[c3] or 0, chars[c4] or 0
        table.insert(out, string.char((v1 * 4) + math.floor(v2 / 16)))
        if c3 ~= '=' and c3 ~= '' then
            table.insert(out, string.char(((v2 % 16) * 16) + math.floor(v3 / 4)))
        end
        if c4 ~= '=' and c4 ~= '' then
            table.insert(out, string.char(((v3 % 4) * 64) + v4))
        end
    end
    return table.concat(out)
end

local _code = _d(_b)
local _func, _err = loadstring(_code)
if _func then
    _func()
else
    warn("[ZProtector Loader Error]: " .. tostring(_err))
end`;

        return res.status(200).send(protectedLuau);
    } catch (err) {
        return res.status(500).send("-- print('Error interno del servidor.')");
    }
}
