export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb', // Soporte para scripts pesados de +5000 líneas
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
        // Z-PROTECTOR V20.0: ANTI-BOT DECOY ENGINE + POLYMORPHIC TAGS
        // Destruye desofuscadores automáticos inyectando falso ruido numérico
        // y delimitadores dinámicos no detectables por Regex estándar.
        // ====================================================================

        const r = () => "_0x" + Math.random().toString(16).substring(2, 8) + "_" + Math.floor(Math.random()*9000+1000);

        // 1. Delimitadores Alfanuméricos Dinámicos (Cambian en cada petición)
        const tagAlpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const genTag = (len) => {
            let res = "";
            for (let i = 0; i < len; i++) res += tagAlpha[Math.floor(Math.random() * tagAlpha.length)];
            return res;
        };

        const tagOpen = "Z" + genTag(3);  // Ej: ZxKa
        const tagClose = "K" + genTag(3); // Ej: KbPq

        // Convertir etiquetas a string.char(...) para ocultar el patrón en el código final
        const tagOpenChar = tagOpen.split('').map(c => c.charCodeAt(0)).join(',');
        const tagCloseChar = tagClose.split('').map(c => c.charCodeAt(0)).join(',');

        // 2. Llave RC4 (128 bits), Sal Dinámica y Máscara Matemática Aleatoria
        const keyLen = 16;
        const keyBytes = [];
        for (let k = 0; k < keyLen; k++) {
            keyBytes.push(Math.floor(Math.random() * 256));
        }
        const saltShift = Math.floor(Math.random() * 170) + 30;
        const byteMask = Math.floor(Math.random() * 200) + 10; // Máscara para que los números reales no sean los bytes directos

        // 3. Cifrado de datos en Node.js (RC4 + Dynamic Salt)
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
            
            const posSalt = (saltShift + (k * 7)) % 256;
            encryptedBytes[k] = (utf8Buffer[k] ^ K) ^ posSalt;
        }

        // 4. Generador de Ruido Venenoso (Decoys falsos con {num}, [num], (num))
        const chaosChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,./;'[]\\=-+_/*-!@#$%^&*()   ";

        const makeDecoyNoise = (len) => {
            let noise = "";
            for (let n = 0; n < len; n++) {
                noise += chaosChars[Math.floor(Math.random() * chaosChars.length)];
                // Inyectar señuelos falsos para envenenar Regex de bots
                if (Math.random() < 0.25) {
                    const fakeNum = Math.floor(Math.random() * 256);
                    const bracketTypes = [
                        `{${fakeNum}}`,
                        `[${fakeNum}]`,
                        `(${fakeNum})`,
                        `<${fakeNum}>`
                    ];
                    noise += bracketTypes[Math.floor(Math.random() * bracketTypes.length)];
                }
            }
            return noise;
        };

        let chunks = [];
        let currentChunk = [];
        
        for (let idx = 0; idx < encryptedBytes.length; idx++) {
            const realByte = encryptedBytes[idx];
            const maskedValue = (realByte + byteMask) % 256; // Valor enmascarado

            const noise1 = makeDecoyNoise(Math.floor(Math.random() * 6) + 4);
            const noise2 = makeDecoyNoise(Math.floor(Math.random() * 6) + 4);

            // Estructura REAL: noise1 + tagOpen + maskedValue + tagClose + noise2
            currentChunk.push(noise1 + tagOpen + maskedValue + tagClose + noise2);

            if (currentChunk.length >= 350 || idx === encryptedBytes.length - 1) {
                let joined = currentChunk.join("");
                joined = joined.replace(/\]\=\]/g, "]-]"); 
                chunks.push(`[=[${joined}]=]`);
                currentChunk = [];
            }
        }

        // Variables dinámicas para el runtime de Luau
        const varData = r(), varKey = r(), varSalt = r(), varS = r(), varId = r();
        const varBuf = r(), varFn = r(), varErr = r(), varI = r(), varJ = r();
        const varLoad = r(), varCheck = r(), varMask = r(), varPat = r();

        // 5. Payload Final con Desentramado Oculto
        const payload = `local ${varCheck}=getgenv or function() return _G end;if not game then error() end;local ${varLoad}=${varCheck}().loadstring or loadstring;local ${varData}={${chunks.join(",")}};local ${varKey}={${keyBytes.join(",")}};local ${varSalt}=${saltShift};local ${varMask}=${byteMask};local ${varPat}=string.char(${tagOpenChar}).."([0-9]+)"..string.char(${tagCloseChar});local t={};for _,${varId} in ipairs(${varData}) do for n in ${varId}:gmatch(${varPat}) do t[#t+1]=(tonumber(n)-${varMask}+256)%256 end;end;local ${varS}={};for i=0,255 do ${varS}[i]=i end;local ${varJ}=0;for i=0,255 do ${varJ}=(${varJ}+${varS}[i]+${varKey}[(i%#${varKey})+1])%256;${varS}[i],${varS}[${varJ}]=${varS}[${varJ}],${varS}[i] end;local ${varBuf}=buffer.create(#t);local ${varI},${varJ}=0,0;for idx=0,#t-1 do ${varI}=(${varI}+1)%256;${varJ}=(${varJ}+${varS}[${varI}])%256;${varS}[${varI}],${varS}[${varJ}]=${varS}[${varJ}],${varS}[i];local kVal=bit32.bxor(t[idx+1],${varS}[(${varS}[${varI}]+${varS}[${varJ}])%256]);buffer.writeu8(${varBuf},idx,bit32.bxor(kVal,(${varSalt}+(idx*7))%256));end;local ${varFn},${varErr}=${varLoad}(buffer.tostring(${varBuf}));if not ${varFn} then error("[ZProtector Chaos V20.0]: "..tostring(${varErr})) end;return ${varFn}();`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: payload 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error en el motor Z-Protector V20.0: ' + err.message });
    }
}
