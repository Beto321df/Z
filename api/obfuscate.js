export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb', // Soporte para scripts de +5000 líneas
        },
    },
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { code } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Debes proporcionar un código Lua válido.' });
        }

        // ====================================================================
        // Z-PROTECTOR V19.5: RC4 ENHANCED + SPACE CHAOS NOISE ENGINE
        // Con inyección de espacios aleatorios y Sal Dinámica por byte.
        // ====================================================================

        // Generador de variables con estilo Hexadecimal confuso
        const r = () => "_0x" + Math.random().toString(16).substring(2, 8) + "_" + Math.floor(Math.random()*9000+1000);

        // 1. Generar Llave RC4 (128 bits) y Sal Dinámica
        const keyLen = 16;
        const keyBytes = [];
        for (let k = 0; k < keyLen; k++) {
            keyBytes.push(Math.floor(Math.random() * 256));
        }
        const saltShift = Math.floor(Math.random() * 170) + 30;

        // 2. Cifrado de datos en Node.js (RC4 + Dynamic Salt)
        const utf8Buffer = Buffer.from(code, 'utf-8');
        const encryptedBytes = new Uint8Array(utf8Buffer.length);

        const S = new Array(256);
        for (let i = 0; i < 256; i++) S[i] = i;
        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + S[i] + keyBytes[i % keyBytes.length]) % 256;
            const temp = S[i]; S[i] = S[j]; S[j] = temp;
        }

        let iPrga = 0, jPrga = 0;
        for (let k = 0; k < utf8Buffer.length; k++) {
            iPrga = (iPrga + 1) % 256;
            jPrga = (jPrga + S[iPrga]) % 256;
            const temp = S[iPrga]; S[iPrga] = S[jPrga]; S[jPrga] = temp;
            const K = S[(S[iPrga] + S[jPrga]) % 256];
            
            // Cifrado RC4 combinado con Sal Dinámica por índice
            const posSalt = (saltShift + (k * 7)) % 256;
            encryptedBytes[k] = (utf8Buffer[k] ^ K) ^ posSalt;
        }

        // 3. Motor de Ruido Masivo CON ESPACIOS INCLUIDOS
        const chaosChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,./;'[]\\=-+_/*-!@#$%^&*()      ";

        let chunks = [];
        let currentChunk = [];
        
        for (let idx = 0; idx < encryptedBytes.length; idx++) {
            const finalB = encryptedBytes[idx];

            let noise1 = "", noise2 = "";
            const len1 = Math.floor(Math.random() * 6) + 3; 
            const len2 = Math.floor(Math.random() * 6) + 3;

            for (let n = 0; n < len1; n++) noise1 += chaosChars[Math.floor(Math.random() * chaosChars.length)];
            for (let n = 0; n < len2; n++) noise2 += chaosChars[Math.floor(Math.random() * chaosChars.length)];

            // Inyectamos espacios impredecibles alrededor del bloque {byte}
            const randomSpaces = " ".repeat(Math.floor(Math.random() * 3));
            currentChunk.push(noise1 + randomSpaces + "{" + finalB + "}" + randomSpaces + noise2);

            if (currentChunk.length >= 400 || idx === encryptedBytes.length - 1) {
                let joined = currentChunk.join("");
                joined = joined.replace(/\]\=\]/g, "]-]"); 
                chunks.push(`[=[${joined}]=]`);
                currentChunk = [];
            }
        }

        // Variables dinámicas para el runtime de Luau
        const varData = r(), varKey = r(), varSalt = r(), varS = r(), varId = r();
        const varBuf = r(), varFn = r(), varErr = r(), varI = r(), varJ = r();
        const varLoad = r(), varCheck = r();

        // 4. Payload Final con Desencritador RC4 + Sal Dinámica en Luau
        const payload = `local ${varCheck}=getgenv or function() return _G end;if not game then error() end;local ${varLoad}=${varCheck}().loadstring or loadstring;local ${varData}={${chunks.join(",")}};local ${varKey}={${keyBytes.join(",")}};local ${varSalt}=${saltShift};local t={};for _,${varId} in ipairs(${varData}) do for n in ${varId}:gmatch("{([0-9]+)}") do t[#t+1]=tonumber(n)end;end;local ${varS}={};for i=0,255 do ${varS}[i]=i end;local ${varJ}=0;for i=0,255 do ${varJ}=(${varJ}+${varS}[i]+${varKey}[(i%#${varKey})+1])%256;${varS}[i],${varS}[${varJ}]=${varS}[${varJ}],${varS}[i] end;local ${varBuf}=buffer.create(#t);local ${varI},${varJ}=0,0;for idx=0,#t-1 do ${varI}=(${varI}+1)%256;${varJ}=(${varJ}+${varS}[${varI}])%256;${varS}[${varI}],${varS}[${varJ}]=${varS}[${varJ}],${varS}[${varI}];local kVal=bit32.bxor(t[idx+1],${varS}[(${varS}[${varI}]+${varS}[${varJ}])%256]);buffer.writeu8(${varBuf},idx,bit32.bxor(kVal,(${varSalt}+(idx*7))%256));end;local ${varFn},${varErr}=${varLoad}(buffer.tostring(${varBuf}));if not ${varFn} then error("[ZProtector Chaos V19.5]: "..tostring(${varErr})) end;return ${varFn}();`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: payload 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error en el motor Z-Protector V19.5: ' + err.message });
    }
}
