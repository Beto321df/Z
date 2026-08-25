export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ msg: 'Método no permitido' });

    const { key, pin } = req.body;
    const MASTER_KEY = process.env.MASTER_KEY || "Zhub_MASTER_2026";
    const DB_URL = "https://loaderz1-default-rtdb.firebaseio.com";

    if (key === MASTER_KEY) {
        return res.status(200).json({ ok: true, isAdmin: true });
    }

    if (!key || key.length < 8) {
        return res.status(400).json({ ok: false, msg: 'La Key debe tener mínimo 8 caracteres.' });
    }

    try {
        const keyRes = await fetch(`${DB_URL}/registered_keys/${key}.json`);
        const keyData = await keyRes.json();

        if (keyData) {
            if (keyData.pin && keyData.pin !== pin) {
                return res.status(401).json({ ok: false, needsPin: true, msg: 'PIN incorrecto o requerido.' });
            }
            return res.status(200).json({ ok: true, isAdmin: false });
        } else {
            if (!pin || pin.length !== 4) {
                return res.status(400).json({ ok: false, needsNewPin: true, msg: 'Crea un PIN de 4 dígitos para esta Key.' });
            }
            await fetch(`${DB_URL}/registered_keys/${key}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin, createdAt: Date.now() })
            });
            return res.status(200).json({ ok: true, isAdmin: false });
        }
    } catch (err) {
        return res.status(500).json({ ok: false, msg: 'Error de conexión con la base de datos.' });
    }
}
