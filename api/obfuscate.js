export const config = {
    api: {
        bodyParser: {
            sizeLimit: '8mb',
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

        const r = () => "_Z_" + Math.random().toString(36).substring(2, 7) + "_" + Math.floor(Math.random() * 900 + 100);

        // 1. Generar Llave RC4 Dinámica (128 bits)
        const keyLen = 16;
        const keyBytes = [];
        for (let k = 0; k < keyLen; k++) {
            keyBytes.push(Math.floor(Math.random() * 256));
        }

        // 2. Cifrado RC4 (KSA + PRGA)
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
            encryptedBytes[k] = utf8Buffer[k] ^ K;
        }

        // 3. Delimitadores Dinámicos Únicos por Solicitud
        const tagOpen = "._" + Math.random().toString(36).substring(2, 5) + "((";
        const tagClose = "))_." ;
        const offsetMath = Math.floor(Math.random() * 30) + 10;

        // 4. Inyección de Ruido Limpia (Sin espacios que rompan tonumber en hex)
        const chaosChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,./;'[]\\=-+_/*-!@#$%^&*()";

        let chunks = [];
        let currentChunk = [];

        for (let idx = 0; idx < encryptedBytes.length; idx++) {
            const rawByte = encryptedBytes[idx];
            const obfuscatedValue = rawByte + offsetMath;

            // Formato sin espacios internos para evitar que tonumber() devuelva nil en Luau
            const formattedVal = (Math.random() > 0.6) 
                ? "0x" + obfuscatedValue.toString(16) 
                : String(obfuscatedValue);

            let noise1 = "", noise2 = "";
            const len1 = Math.floor(Math.random() * 5) + 3;
            const len2 = Math.floor(Math.random() * 5) + 3;

            for (let n = 0; n < len1; n++) noise1 += chaosChars[Math.floor(Math.random() * chaosChars.length)];
            for (let n = 0; n < len2; n++) noise2 += chaosChars[Math.floor(Math.random() * chaosChars.length)];

            const token = `${noise1}..${tagOpen}${formattedVal}${tagClose}..${noise2}`;
            currentChunk.push(token);

            if (currentChunk.length >= 250 || idx === encryptedBytes.length - 1) {
                let joined = currentChunk.join("..");
                joined = joined.replace(/\]\=\]/g, "]-]");
                chunks.push(`[=[${joined}]=]`);
                currentChunk = [];
            }
        }

        // 5. Generación de Identificadores Dinámicos
        const varData = r(), varKey = r(), varS = r(), varId = r();
        const varBuf = r(), varFn = r(), varErr = r(), varI = r(), varJ = r();
        const varLoad = r(), varCheck = r(), varPattern = r(), varOffset = r();

        // Escapar caracteres especiales de Luau usando %$&
        const escapeLuaPattern = (str) => str.replace(/[\%\.\(\)\[\]\^\$\*\+\-\?]/g, '%$&');
        
        const regexTagOpen = escapeLuaPattern(tagOpen);
        const regexTagClose = escapeLuaPattern(tagClose);
        
        // Patrón limpio para capturar al fanumérico exacto entre delimitadores
        const luauRegex = `${regexTagOpen}(%%w+)${regexTagClose}`;

        // 6. Payload Final Blindado
        const payload = `local ${varCheck}=getgenv or function() return _G end;if not game then error() end;local ${varLoad}=${varCheck}().loadstring or loadstring;local ${varOffset}=${offsetMath};local ${varPattern}="${luauRegex}";local ${varData}={${chunks.join(",")}};local ${varKey}={${keyBytes.join(",")}};local t={};for _,${varId} in ipairs(${varData}) do for n in ${varId}:gmatch(${varPattern}) do t[#t+1]=(tonumber(n) or 0)-${varOffset} end end;local ${varS}={};for i=0,255 do ${varS}[i]=i end;local ${varJ}=0;for i=0,255 do ${varJ}=(${varJ}+${varS}[i]+${varKey}[(i%#${varKey})+1])%256;${varS}[i],${varS}[${varJ}]=${varS}[${varJ}],${varS}[i] end;local ${varBuf}=buffer.create(#t);local ${varI},${varJ}=0,0;for idx=0,#t-1 do ${varI}=(${varI}+1)%256;${varJ}=(${varJ}+${varS}[${varI}])%256;${varS}[${varI}],${varS}[${varJ}]=${varS}[${varJ}],${varS}[${varI}];buffer.writeu8(${varBuf},idx,bit32.bxor(t[idx+1],${varS}[(${varS}[${varI}]+${varS}[${varJ}])%256]));end;local ${varFn},${varErr}=${varLoad}(buffer.tostring(${varBuf}));if not ${varFn} then error("[Z-Chaos Engine]: "..tostring(${varErr})) end;return ${varFn}();`;

        return res.status(200).json({
            success: true,
            obfuscatedCode: payload
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error en el motor Z-Protector V19.2: ' + err.message });
    }
}
