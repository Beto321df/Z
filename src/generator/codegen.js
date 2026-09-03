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
    return `(((${calc} / ${r2}) - ${r1}))`;
}

class CodeGenerator {
    generate(rawLuaCode) {
        const codeToObfuscate = typeof rawLuaCode === 'string' 
            ? rawLuaCode 
            : (rawLuaCode && rawLuaCode.source) || 'print("Z-Protector Loaded")';

        // 1. Cifrado Rolling Key UTF-8
        const symbolKey = "/.;,['\\]=-0987654321//?";
        let currentKeyState = 0x7E;
        const encryptedBytes = [];
        const inputBuffer = Buffer.from(codeToObfuscate, 'utf-8');

        for (let i = 0; i < inputBuffer.length; i++) {
            const byteVal = inputBuffer[i];
            const keyByte = symbolKey.charCodeAt(i % symbolKey.length);
            
            const cipherByte = (byteVal ^ keyByte ^ currentKeyState) & 0xFF;
            encryptedBytes.push(cipherByte);

            currentKeyState = (currentKeyState * 16777619 + cipherByte + keyByte) & 0xFF;
        }

        // Identificadores dinámicos
        const vEnv = generateRandomVarName();
        const vKey = generateRandomVarName();
        const vData = generateRandomVarName();
        const vOut = generateRandomVarName();
        const vState = generateRandomVarName();
        const vI = generateRandomVarName();
        const vB = generateRandomVarName();
        const vK = generateRandomVarName();
        const vBit = generateRandomVarName();
        const vStr = generateRandomVarName();
        const vExec = generateRandomVarName();
        const vTable = generateRandomVarName();
        const vOp = generateRandomVarName();

        const keyCharCodes = symbolKey
            .split('')
            .map(c => `string.char(${c.charCodeAt(0)})`)
            .join('..');

        const bytesFormatted = `{${encryptedBytes.map(b => obfuscateNumber(b)).join(',')}}`;

        // 2. Estructura con Ofuscación de Métodos Nativos y Expresiones Dinámicas
        return `--// Z-Protector Anti-AST Obfuscation Engine
local ${vEnv} = (getfenv and getfenv() or _ENV or {})
local ${vTable} = {
    [${obfuscateNumber(1)}] = ${vEnv}.string or string,
    [${obfuscateNumber(2)}] = ${vEnv}.table or table,
    [${obfuscateNumber(3)}] = ${vEnv}.bit32 or bit32
}

local ${vKey} = ${keyCharCodes}
local ${vData} = ${bytesFormatted}
local ${vOut} = {}
local ${vState} = ${obfuscateNumber(126)}

for ${vI} = ${obfuscateNumber(1)}, #${vData} do
    local ${vK} = ${vTable}[1].byte(${vKey}, ((${vI} - ${obfuscateNumber(1)}) % #${vKey}) + ${obfuscateNumber(1)})
    local ${vB} = ${vData}[${vI}]
    
    local ${vOp} = ${vTable}[3].bxor(${vB}, ${vK}, ${vState})
    ${vOut}[${vI}] = ${vTable}[1].char(${vOp})
    
    ${vState} = (${vState} * ${obfuscateNumber(33)} + ${vB} + ${vK}) % ${obfuscateNumber(256)}
end

local ${vStr} = ${vTable}[2].concat(${vOut})
local ${vExec} = (loadstring or ${vEnv}.loadstring or getgenv().loadstring)(${vStr})

return ${vExec}()`;
    }
}

module.exports = CodeGenerator;
