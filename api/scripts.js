export default async function handler(req, res) {
    const DB_URL = "https://loaderz1-default-rtdb.firebaseio.com";
    const SECRET = process.env.FIREBASE_SECRET;

    // LISTAR SCRIPTS DEL USUARIO
    if (req.method === 'GET') {
        const { user } = req.query;
        if (!user) return res.status(400).json({ msg: 'Usuario no proporcionado' });

        try {
            const cleanUser = user.replace(/[^a-zA-Z0-9_-]/g, "");
            const userScriptsRes = await fetch(`${DB_URL}/users/${cleanUser}/user_scripts.json?auth=${SECRET}`);
            const userScriptsMap = await userScriptsRes.json() || {};
            const scriptIds = Object.keys(userScriptsMap);

            const scriptsData = {};
            for (const id of scriptIds) {
                const sRes = await fetch(`${DB_URL}/scripts/${id}.json?auth=${SECRET}`);
                const sData = await sRes.json();
                if (sData) {
                    scriptsData[id] = sData;
                }
            }

            return res.status(200).json({ scripts: scriptsData });
        } catch (err) {
            return res.status(500).json({ msg: 'Error al leer scripts de Firebase' });
        }
    }

    // CREAR O ACTUALIZAR SCRIPT
    if (req.method === 'POST') {
        const { user, id, code, isUpdate } = req.body;
        if (!user || !id || !code) {
            return res.status(400).json({ msg: 'Usuario, ID y código son obligatorios.' });
        }

        const cleanUser = user.replace(/[^a-zA-Z0-9_-]/g, "");
        const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, "");

        try {
            const scriptRefUrl = `${DB_URL}/scripts/${cleanId}.json?auth=${SECRET}`;

            if (!isUpdate) {
                const checkRes = await fetch(scriptRefUrl);
                const existingData = await checkRes.json();
                if (existingData && existingData.code) {
                    return res.status(400).json({ msg: `El script "${cleanId}" ya existe.` });
                }
            } else {
                if (cleanUser !== 'admin123') {
                    const checkRes = await fetch(scriptRefUrl);
                    const existingData = await checkRes.json();
                    if (existingData && existingData.owner && existingData.owner !== cleanUser) {
                        return res.status(403).json({ msg: 'No tienes permiso para modificar este script.' });
                    }
                }
            }

            await fetch(scriptRefUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner: cleanUser, code, createdAt: Date.now() })
            });

            await fetch(`${DB_URL}/users/${cleanUser}/user_scripts/${cleanId}.json?auth=${SECRET}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(true)
            });

            return res.status(200).json({ ok: true, msg: 'Script guardado correctamente.' });
        } catch (err) {
            return res.status(500).json({ msg: 'Error al guardar el script.' });
        }
    }

    // ELIMINAR SCRIPT
    if (req.method === 'DELETE') {
        const { user, id } = req.body;
        if (!user || !id) return res.status(400).json({ msg: 'Usuario e ID son requeridos.' });

        const cleanUser = user.replace(/[^a-zA-Z0-9_-]/g, "");
        const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, "");

        try {
            const scriptRefUrl = `${DB_URL}/scripts/${cleanId}.json?auth=${SECRET}`;
            const checkRes = await fetch(scriptRefUrl);
            const existingData = await checkRes.json();

            if (!existingData) {
                return res.status(404).json({ msg: 'El script no existe.' });
            }

            if (cleanUser !== 'admin123' && existingData.owner !== cleanUser) {
                return res.status(403).json({ msg: 'No tienes permisos para eliminar este script.' });
            }

            await fetch(scriptRefUrl, { method: 'DELETE' });
            await fetch(`${DB_URL}/users/${existingData.owner || cleanUser}/user_scripts/${cleanId}.json?auth=${SECRET}`, { method: 'DELETE' });

            return res.status(200).json({ ok: true, msg: 'Script eliminado.' });
        } catch (err) {
            return res.status(500).json({ msg: 'Error al eliminar el script.' });
        }
    }
}
