export default async function handler(req, res) {
    const { id } = req.query;
    const accept = (req.headers['accept'] || '').toLowerCase();
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const isSecHeader = !!req.headers['sec-ch-ua'];

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    const isBrowser = isSecHeader || accept.includes('text/html');
    const isBot = ua.includes('discord') || ua.includes('python') ||
                  ua.includes('axios') || ua.includes('node') ||
                  ua.includes('curl') || ua.includes('wget') ||
                  ua.includes('go-http-client') || ua.includes('java') ||
                  ua.includes('bot') || ua.includes('crawler');

    if (isBrowser || isBot) {
        return res.status(403).send("-- Z Protector: acceso denegado.");
    }

    if (!id) {
        return res.status(400).send("-- Z Protector: ID no proporcionado.");
    }

    try {
        const cleanId = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
        if (!cleanId) {
            return res.status(400).send("-- Z Protector: ID inválido.");
        }

        const DB_URL = 'https://loaderz1-default-rtdb.firebaseio.com';
        const SECRET = process.env.FIREBASE_SECRET;
        const fbRes = await fetch(`${DB_URL}/scripts/${cleanId}.json?auth=${SECRET}`);
        const data = await fbRes.json();

        if (!fbRes.ok || !data || data.error) {
            return res.status(404).send("-- Z Protector: script no encontrado.");
        }

        const code = typeof data === 'string'
            ? data
            : (typeof data.code === 'string' ? data.code : '');

        if (!code.trim()) {
            return res.status(404).send("-- Z Protector: script vacío o inválido.");
        }

        // El campo code ya contiene el output del motor Z-Lang.
        // No volver a envolverlo en Base64 ni modificar su sintaxis.
        return res.status(200).send(code);
    } catch (err) {
        return res.status(500).send("-- Z Protector: error interno del servidor.");
    }
}
