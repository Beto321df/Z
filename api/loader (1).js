// Handler de Vercel (Loader Luau) protegido y ofuscado
const _0x_str = [
    "Q29udGVudC1UeXBl", // 0: Content-Type
    "dGV4dC9wbGFpbg==", // 1: text/plain
    "aHR0cHM6Ly94eHhuMS52ZXJjZWwuYXBwL2FwaS9nZXQtc2NyaXB0P2lkPQ==", // 2: URL Base API
    "JmtleT0=", // 3: &key=
    "W05leHVzIFNlY3VyaXR5XSBQb3IgZmF2b3IgZGVmaW5lIF9HLktleSBhbnRlcyBkZSBlamVjdXRhci4=", // 4: Mensaje sin Key
    "RXJyb3I=", // 5: Error
    "QWNjZXNvIGRlbmVnYWRv", // 6: Acceso denegado
    "W05leHVzIFNlY3VyaXR5XSBFcnJvciBkZSBhdXRlbnRpY2FjaW9uLg==" // 7: Mensaje error de auth
];

const _0x_dec = (i) => Buffer.from(_0x_str[i], 'base64').toString('utf-8');

export default async function handler(req, res) {
    const { id } = req.query;

    res.setHeader(_0x_dec(0), _0x_dec(1));

    const _0xsId = id || '';
    const _0xurl = _0x_dec(2);
    const _0xkey = _0x_dec(3);
    const _0xmsgKey = _0x_dec(4);
    const _0xe1 = _0x_dec(5);
    const _0xe2 = _0x_dec(6);
    const _0xmsgAuth = _0x_dec(7);

    const _0xloader = `
if not _G.Key then
    return warn("${_0xmsgKey}")
end

local success, result = pcall(function()
    return game:HttpGet("${_0xurl}" .. "${_0xsId}" .. "${_0xkey}" .. tostring(_G.Key))
end)

if not success or result:find("${_0xe1}") or result:find("${_0xe2}") then
    return warn(result or "${_0xmsgAuth}")
end

loadstring(result)()
`;

    return res.status(200).send(_0xloader);
}
