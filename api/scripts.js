export default async function handler(req, res) {
    const DB_URL = "https://loaderz1-default-rtdb.firebaseio.com";

    // LISTAR SCRIPTS
    if (req.method === 'GET') {
        const { key } = req.query;
        try {
            const r = await fetch(`${DB_URL}/scripts.json`);
            const data = await r.json() || {};
            return res.status(200).json({ scripts: data });
        } catch (err) {
            return res.status(500).json({ msg: 'Error de servidor al leer scripts' });
        }
    }

    // CREAR O ACTUALIZAR SCRIPT
    if (req.method === 'POST') {
        const { key, id, code } = req.body;
        if (!id || !code) {
            return res.status(400).json({ msg: 'ID y código son obligatorios.' });
        }

        const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, "");
        try {
            await fetch(`${DB_URL}/scripts/${cleanId}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ownerKey: key, code, createdAt: Date.now() })
            });
            return res.status(200).json({ ok: true });
        } catch (err) {
            return res.status(500).json({ msg: 'Error al guardar el script.' });
        }
    }

    // ELIMINAR SCRIPT
    if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ msg: 'ID no proporcionado.' });

        try {
            await fetch(`${DB_URL}/scripts/${id}.json`, { method: 'DELETE' });
            return res.status(200).json({ ok: true });
        } catch (err) {
            return res.status(500).json({ msg: 'Error al eliminar el script.' });
        }
    }
}
