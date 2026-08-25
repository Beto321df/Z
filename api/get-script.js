// Handler de Vercel protegido y ofuscado
const _0x_str = [
    "YWNjZXB0", // 0: accept
    "dXNlci1hZ2VudA==", // 1: user-agent
    "Q29udGVudC1UeXBl", // 2: Content-Type
    "dGV4dC9wbGFpbg==", // 3: text/plain
    "dGV4dC9odG1s", // 4: text/html
    "eC12ZXJjZWwtaXAtY291bnRyeQ==", // 5: x-vercel-ip-country
    "eC12ZXJjZWwtaXAtY2l0eQ==", // 6: x-vercel-ip-city
    "RGVzY29ub2NpZG8=", // 7: Desconocido
    "RGVzY29ub2NpZGE=", // 8: Desconocida
    "RGlzcG9zaXRpdm8gRGVzY29ub2NpZG8=", // 9: Dispositivo Desconocido
    "YW5kcm9pZA==", // 10: android
    "QW5kcm9pZA==", // 11: Android
    "aXBob25l", // 12: iphone
    "aXBhZA==", // 13: ipad
    "aVBob25lIC8gaU9T", // 14: iPhone / iOS
    "d2luZG93cw==", // 15: windows
    "UEMgV2luZG93cw==", // 16: PC Windows
    "bWFjaW50b3No", // 17: macintosh
    "bWFjIG9z", // 18: mac os
    "TWFj", // 19: Mac
    "bGludXg=", // 20: linux
    "TGludXg=", // 21: Linux
    "aHR0cHM6Ly9sb2FkZXJ6MS1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20vc2NyaXB0cy8=", // 22: firebase base url
    "Lmpzb24=", // 23: .json
    "LS0gRXJyb3I6IEZhbHRhIGVsIHBhciVDMyVBMG1ldHJvIElE", // 24: Error ID
    "LS0gRXJyb3I6IFNjcmlwdCBubyBlbmNvbnRyYWRvIGVuIEZpcmViYXNl", // 25: Error Firebase
    "LS0gRXJyb3IgaW50ZXJubyBhbCBjb25lY3RhciBjb24gbGEgYmFzZSBkZSBkYXRvcw==" // 26: Error servidor
];

const _0x_dec = (i) => Buffer.from(_0x_str[i], 'base64').toString('utf-8');

export default async function handler(req, res) {
    const { id } = req.query;
    const _0xa = (req.headers[_0x_dec(0)] || '').toLowerCase();
    const _0xua = (req.headers[_0x_dec(1)] || '').toLowerCase();

    res.setHeader(_0x_dec(2), _0x_dec(3));

    // Bloqueo para navegadores web
    if (_0xa.includes(_0x_dec(4))) {
        const _0xcnt = req.headers[_0x_dec(5)] || _0x_dec(7);
        const _0xcty = req.headers[_0x_dec(6)] || _0x_dec(8);

        let _0xdev = _0x_dec(9);
        if (_0xua.includes(_0x_dec(10))) _0xdev = _0x_dec(11);
        else if (_0xua.includes(_0x_dec(12)) || _0xua.includes(_0x_dec(13))) _0xdev = _0x_dec(14);
        else if (_0xua.includes(_0x_dec(15))) _0xdev = _0x_dec(16);
        else if (_0xua.includes(_0x_dec(17)) || _0xua.includes(_0x_dec(18))) _0xdev = _0x_dec(19);
        else if (_0xua.includes(_0x_dec(20))) _0xdev = _0x_dec(21);

        const _0xalert = `-- ====================================================
-- 🚫 ACCESO DENEGADO: EJECUCIÓN NO AUTORIZADA
-- Este script SOLO se puede ejecutar dentro de Roblox.
-- ====================================================
-- DISPOSITIVO   : ${_0xdev}
-- UBICACIÓN     : ${_0xcty}, ${_0xcnt}
-- ====================================================
-- ADVERTENCIA: Intento de extracción de código detectado.
-- Cierra esta pestaña inmediatamente.
-- ====================================================`;

        return res.status(403).send(_0xalert);
    }

    if (!id) {
        return res.status(400).send(_0x_dec(24));
    }

    try {
        const _0xfbUrl = `${_0x_dec(22)}${id}${_0x_dec(23)}`;
        const _0xres = await fetch(_0xfbUrl);
        const _0xdata = await _0xres.json();

        if (!_0xdata || !_0xdata.code) {
            return res.status(404).send(_0x_dec(25));
        }

        return res.status(200).send(_0xdata.code);

    } catch (_0xerr) {
        return res.status(500).send(_0x_dec(26));
    }
}
