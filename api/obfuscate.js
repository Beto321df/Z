export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb', // Soporte para scripts pesados
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
        // Z-PROTECTOR V21.0: MULTI-POLYMORPHIC DECOY ENGINE
        // Cambia la estructura de ofuscación cada 400 líneas.
        // Ciclo: 1. Tags + Ruido | 2. Rutas (/111/222) | 3. Flotantes (120.21,)
        // ====================================================================

        const r = () => "_0x" + Math.random().toString(16).substring(2, 8) + "_" + Math.floor(Math.random()*9000+1000);

        // 1. Delimitadores Dinámicos (Para el Estilo 1)
        const tagAlpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const genTag = (len) => {
            let res = "";
            for (let i = 0; i < len; i++) res += tagAlpha[Math.floor(Math.random() * tagAlpha.length)];
            return res;
        };

        const tagOpen = "Z" + genTag(3);
        const tagClose = "K" + genTag(3);
        const tagOpenChar = tagOpen.split('').map(c => c.charCodeAt(0)).join(',');
        const tagCloseChar = tagClose.split('').map(c => c.charCodeAt(0)).join(',');

        // 2. Llave RC4 (128 bits), Sal Dinámica y Máscara Matemática Aleatoria
        const keyLen = 16;
        const keyBytes = [];
        for (let k = 0; k < keyLen; k++) {
            keyBytes.push(Math.floor(Math.random() * 256));
        }
        const saltShift = Math.floor(Math.random() * 170) + 30;
        const byteMask = Math.floor(Math.random() * 200) + 10;

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

        // Caracteres de caos SIN slashes (/) ni puntos (.) ni comas (,) para evitar cruces entre patrones
        const chaosChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789;'\\[]=-+_*-!@#$%^&*()   ";
        const makeDecoyNoise = (len) => {
            let noise = "";
            for (let n = 0; n < len; n++) noise += chaosChars[Math.floor(Math.random() * chaosChars.length)];
            return noise;
        };

        // 4. MOTOR POLIMÓRFICO: Ciclado de formato cada 400 bytes
        let chunks = [];
        let currentChunk = "";
        let byteCount = 0;
        let chunkIndex = 0;
        
        for (let idx = 0; idx < encryptedBytes.length; idx++) {
            const realByte = encryptedBytes[idx];
            const maskedValue = (realByte + byteMask) % 256;

            let style = chunkIndex % 3; // Cicla entre 0, 1 y 2

            if (style === 0) {
                // ESTILO 0: Tu ofuscación actual (Tags + Ruido)
                const noise1 = makeDecoyNoise(Math.floor(Math.random() * 4) + 2);
                const noise2 = makeDecoyNoise(Math.floor(Math.random() * 4) + 2);
                currentChunk += noise1 + tagOpen + maskedValue + tagClose + noise2;

            } else if (style === 1) {
                // ESTILO 1: Directorios y Slashes (/111/22/33)
                const fakeDirs = ["/usr", "/bin", "/var", "/tmp", "/sys", "/etc"];
                // Agrega una "carpeta" falsa de vez en cuando para despistar
                if (Math.random() > 0.6) currentChunk += fakeDirs[Math.floor(Math.random() * fakeDirs.length)];
                currentChunk += "/" + maskedValue;

            } else if (style === 2) {
                // ESTILO 2: Flotantes Matrix (120102.21212,)
                const prefixNum = Math.floor(Math.random() * 900000) + 100000; // Ej: 120102
                currentChunk += prefixNum + "." + maskedValue + ",";
                // A veces agrega un flotante falso que no lleva coma al final para joder el Regex
                if (Math.random() > 0.7) {
                    currentChunk += (Math.floor(Math.random() * 9000) + 100) + "." + (Math.floor(Math.random() * 200)) + " ";
                }
            }

            byteCount++;

            // Corte cada 400 líneas (bytes) o al final del archivo
            if (byteCount >= 400 || idx === encryptedBytes.length - 1) {
                let joined = currentChunk.replace(/\]\=\]/g, "]-]"); 
                chunks.push(`[=[${joined}]=]`);
                currentChunk = "";
                byteCount = 0;
                chunkIndex++;
            }
        }

        // Variables dinámicas
        const varData = r(), varKey = r(), varSalt = r(), varS = r(), varId = r();
        const varBuf = r(), varFn = r(), varErr = r(), varI = r(), varJ = r();
        const varLoad = r(), varCheck = r(), varMask = r(), varPatTable = r(), varPat = r();

        // 5. PAYLOAD LUA DINÁMICO
        // Contiene una tabla con los 3 patrones Regex. Lua elige el correcto basado en el índice del chunk.
        const payload = `local ${varCheck}=getgenv or function() return _G end;if not game then error() end;local ${varLoad}=${varCheck}().loadstring or loadstring;local ${varData}={${chunks.join(",")}};local ${varKey}={${keyBytes.join(",")}};local ${varSalt}=${saltShift};local ${varMask}=${byteMask};` +
        `local ${varPatTable}={string.char(${tagOpenChar}).."(%d+)"..string.char(${tagCloseChar}), "/(%d+)", "%.(%d+),"};` +
        `local t={};for i,${varId} in ipairs(${varData}) do local ${varPat}=${varPatTable}[((i-1)%3)+1]; for n in ${varId}:gmatch(${varPat}) do t[#t+1]=(tonumber(n)-${varMask}+256)%256 end;end;` +
        `local ${varS}={};for i=0,255 do ${varS}[i]=i end;local ${varJ}=0;for i=0,255 do ${varJ}=(${varJ}+${varS}[i]+${varKey}[(i%#${varKey})+1])%256;${varS}[i],${varS}[${varJ}]=${varS}[${varJ}],${varS}[i] end;local ${varBuf}=buffer.create(#t);local ${varI},${varJ}=0,0;for idx=0,#t-1 do ${varI}=(${varI}+1)%256;${varJ}=(${varJ}+${varS}[${varI}])%256;${varS}[${varI}],${varS}[${varJ}]=${varS}[${varJ}],${varS}[${varI}];local kVal=bit32.bxor(t[idx+1],${varS}[(${varS}[${varI}]+${varS}[${varJ}])%256]);buffer.writeu8(${varBuf},idx,bit32.bxor(kVal,(${varSalt}+(idx*7))%256));end;local ${varFn},${varErr}=${varLoad}(buffer.tostring(${varBuf}));if not ${varFn} then error("[ZProtector Chaos V21.0]: "..tostring(${varErr})) end;return ${varFn}();`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: payload 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error en el motor Z-Protector V21.0: ' + err.message });
    }
}
