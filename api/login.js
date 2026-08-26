export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, msg: 'Método no permitido' });
    }

    const { mode, user, pass, pin } = req.body;

    if (!user || !pass || !pin) {
        return res.status(400).json({ ok: false, msg: 'Todos los campos son obligatorios.' });
    }

    const databaseURL = "https://loaderz1-default-rtdb.firebaseio.com";

    try {
        const userRefUrl = `${databaseURL}/users/${user}.json`;

        if (mode === 'signup') {
            // Verificar si el usuario ya existe
            const checkRes = await fetch(userRefUrl);
            const existingData = await checkRes.json();

            if (existingData) {
                return res.status(400).json({ ok: false, msg: 'El nombre de usuario ya está en uso.' });
            }

            // Registrar nuevo usuario
            const saveRes = await fetch(userRefUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pass, pin, createdAt: Date.now() })
            });

            if (saveRes.ok) {
                return res.status(200).json({ ok: true, msg: 'Cuenta creada correctamente.' });
            } else {
                return res.status(500).json({ ok: false, msg: 'Error al guardar en la base de datos.' });
            }

        } else if (mode === 'signin') {
            // Iniciar sesión
            const checkRes = await fetch(userRefUrl);
            const userData = await checkRes.json();

            if (!userData) {
                return res.status(404).json({ ok: false, msg: 'El usuario no existe.' });
            }

            if (userData.pass !== pass) {
                return res.status(401).json({ ok: false, msg: 'Contraseña incorrecta.' });
            }

            return res.status(200).json({ ok: true, msg: 'Login exitoso.' });
        } else {
            return res.status(400).json({ ok: false, msg: 'Modo inválido.' });
        }

    } catch (error) {
        return res.status(500).json({ ok: false, msg: 'Error interno del servidor.' });
    }
}
