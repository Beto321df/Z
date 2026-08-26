export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, msg: 'Método no permitido' });
    }

    const { key, pin } = req.body;
    const MASTER_KEY = process.env.MASTER_KEY || "Zhub_MASTER_2026";
    const DB_URL = "https://loaderz1-default-rtdb.firebaseio.com";
    const SECRET = process.env.FIREBASE_SECRET; // <-- Tu secreto de Vercel

    // MÁSTER ADMIN CHECK
    if (key === MASTER_KEY) {
        return res.status(200).json({ ok: true, isAdmin: true });
    }

    if (!key || key.length < 8) {
        return res.status(400).json({ ok: false, msg: 'La Key debe tener al menos 8 caracteres.' });
    }

    try {
        // Consultar la key usando el secreto (?auth=...)
        const keyRes = await fetch(`${DB_URL}/registered_keys/${key}.json?auth=${SECRET}`);
        const keyData = await keyRes.json();

        if (keyData) {
            if (keyData.pin) {
                if (!pin || pin !== keyData.pin) {
                    return res.status(401).json({ ok: false, needsPin: true, msg: 'PIN de 4 dígitos incorrecto o requerido.' });
                }
            }
            return res.status(200).json({ ok: true, isAdmin: false });
        } else {
            if (!pin || pin.length !== 4 || isNaN(pin)) {
                return res.status(400).json({ ok: false, needsNewPin: true, msg: 'Key nueva. Ingresa un PIN de 4 dígitos para registrarla.' });
            }

            // Registrar la key nueva usando el secreto (?auth=...)
            await fetch(`${DB_URL}/registered_keys/${key}.json?auth=${SECRET}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin, createdAt: Date.now() })
            });

            return res.status(200).json({ ok: true, isAdmin: false });
        }
    } catch (err) {
        return res.status(500).json({ ok: false, msg: 'Error al conectar con la base de datos.' });
    }
}
