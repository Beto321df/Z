function generateRandomVarName(length = 16) {
    const firstChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    const allChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
    let result = firstChars[Math.floor(Math.random() * firstChars.length)];
    for (let i = 1; i < length; i++) {
        result += allChars[Math.floor(Math.random() * allChars.length)];
    }
    return result;
}

// Convierte un número en una expresión matemática compleja
function obfuscateNumber(num) {
    const r1 = Math.floor(Math.random() * 50) + 1;
    const r2 = Math.floor(Math.random() * 20) + 1;
    const calc = (num + r1) * r2;
    return `(((${calc}/${r2})-${r1}))`;
}

class CodeGenerator {
    generate(rawLuaCode) {
        const codeToObfuscate = typeof rawLuaCode === 'string' 
            ? rawLuaCode 
            : (rawLuaCode && rawLuaCode.source) || 'print("Z-Protector Loaded")';

        // 1. Cifrado Rolling Key UTF-8 Sincronizado
        const symbolKey = "/.;,['\\]=-0987654321//?";
        let currentKeyState = 0x5A;
        const encryptedBytes = [];
        const inputBuffer = Buffer.from(codeToObfuscate, 'utf-8');

        for (let i = 0; i < inputBuffer.length; i++) {
            const byteVal = inputBuffer[i];
            const keyByte = symbolKey.charCodeAt(i % symbolKey.length);
            
            const cipherByte = (byteVal ^ keyByte ^ currentKeyState) & 0xFF;
            encryptedBytes.push(cipherByte);

            // Sincronización exacta con el cliente Lua (* 33)
            currentKeyState = (currentKeyState * 33 + cipherByte + keyByte) & 0xFF;
        }

        // Identificadores dinámicos aleatorios
        const vG = generateRandomVarName();
        const vK = generateRandomVarName();
        const vD = generateRandomVarName();
        const vO = generateRandomVarName();
        const vS = generateRandomVarName();
        const vI = generateRandomVarName();
        const vB = generateRandomVarName();
        const vKB = generateRandomVarName();
        const vF = generateRandomVarName();
        const vR = generateRandomVarName();
        const vE = generateRandomVarName();
        const vStr = generateRandomVarName();
        const vTbl = generateRandomVarName();
        const vOp = generateRandomVarName();

        const keyCharCodes = symbolKey
            .split('')
            .map(c => `string.char(${c.charCodeAt(0)})`)
            .join('..');

        const bytesFormatted = `{${encryptedBytes.map(b => obfuscateNumber(b)).join(',')}}`;

        // 2. Generación en 1 Sola Línea sin comentarios visibles
        return `local ${vG}=(getfenv and getfenv())or _ENV or _G;local ${vTbl}={[${obfuscateNumber(1)}]=string or(${vG} and ${vG}.string),[${obfuscateNumber(2)}]=table or(${vG} and ${vG}.table),[${obfuscateNumber(3)}]=bit32 or(${vG} and ${vG}.bit32)};local ${vK}=${keyCharCodes};local ${vD}=${bytesFormatted};local ${vO}={};local ${vS}=${obfuscateNumber(90)};for ${vI}=${obfuscateNumber(1)},#${vD} do local ${vKB}=${vTbl}[1].byte(${vK},((${vI}-${obfuscateNumber(1)})%#${vK})+${obfuscateNumber(1)});local ${vB}=${vD}[${vI}];local ${vOp}=${vTbl}[3].bxor(${vB},${vKB},${vS});${vO}[${vI}]=${vTbl}[1].char(${vOp});${vS}=(${vS}*${obfuscateNumber(33)}+${vB}+${vKB})%${obfuscateNumber(256)} end;local ${vStr}=${vTbl}[2].concat(${vO});local ${vF}=loadstring or(${vG} and ${vG}.loadstring)or getgenv().loadstring;local ${vR},${vE}=${vF}(${vStr});if type(${vR})=="function" then return ${vR}() else error("[Z-Protector Error]: "..tostring(${vE})) end`;
    }
}

module.exports = CodeGenerator;
