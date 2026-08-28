export default async function handler(req, res) {
    const { id } = req.query;
    const accept = (req.headers['accept'] || '').toLowerCase();
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const isSecHeader = !!req.headers['sec-ch-ua'];

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // 1. Detección de navegadores y bots de extracción
    const isBrowser = isSecHeader || accept.includes('text/html');
    const isBot = !ua || ua.includes('discord') || ua.includes('python') || 
                  ua.includes('axios') || ua.includes('node') || 
                  ua.includes('curl') || ua.includes('wget') || 
                  ua.includes('go-http-client') || ua.includes('java') ||
                  ua.includes('bot') || ua.includes('crawler');

    if (isBrowser || isBot) {
        return res.status(403).send(`-- ====================================================\n-- 🚫 ACCESO DENEGADO\n-- Este script solo se ejecuta desde Roblox.\n-- ====================================================`);
    }

    if (!id) {
        return res.status(400).send("-- Error: ID no proporcionado.");
    }

    try {
        const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, "");
        const DB_URL = "https://loaderz1-default-rtdb.firebaseio.com";
        const SECRET = process.env.FIREBASE_SECRET;

        // Petición privada autenticada en el servidor
        const fbRes = await fetch(`${DB_URL}/scripts/${cleanId}.json?auth=${SECRET}`);
        const data = await fbRes.json();

        if (!data || !data.code) {
            return res.status(404).send("-- Error: Script no encontrado.");
        }

        // Codificación de seguridad para evitar lectura simple mediante interceptores HTTP
        const encodedCode = Buffer.from(data.code).toString('base64');
        const protectedLuau = `local _b="${encodedCode}"
local function _d(s)
    local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    s=string.gsub(s,'[^'..b..'=]','')
    return (s:gsub('.',function(x)
        if(x=='=')then return '' end
        local r,f='',(b:find(x)-1)
        for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>=1 and '1' or '0') end
        return r
    end):gsub('%d%d%d%d%d%d%d%d',function(x)
        if(#x~=8)then return '' end
        local c=0
        for i=1,8 do c=c+(x:sub(i,i)=='1' and 2^(8-i) or 0) end
        return string.char(c)
    end))
end
loadstring(_d(_b))()`;

        return res.status(200).send(protectedLuau);
    } catch (err) {
        return res.status(500).send("-- Error interno del servidor.");
    }
}
