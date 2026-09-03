function generateRandomVarName(length = 16) {
    const firstChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    const allChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
    let result = firstChars[Math.floor(Math.random() * firstChars.length)];
    for (let i = 1; i < length; i++) {
        result += allChars[Math.floor(Math.random() * allChars.length)];
    }
    return result;
}

class CodeGenerator {
    generate(rawLuaCode) {
        const codeToObfuscate = typeof rawLuaCode === 'string' 
            ? rawLuaCode 
            : (rawLuaCode && rawLuaCode.source) || 'print("Z-Protector Loaded")';

        const symbolKey = "/.;,['\\]=-0987654321//?";
        let currentKeyState = 0x5A;
        const encryptedBytes = [];

        // Cifrado Rolling Key XOR
        for (let i = 0; i < codeToObfuscate.length; i++) {
            const charCode = codeToObfuscate.charCodeAt(i);
            const keyByte = symbolKey.charCodeAt(i % symbolKey.length);
            
            const cipherByte = (charCode ^ keyByte ^ currentKeyState) & 0xFF;
            encryptedBytes.push(cipherByte);

            currentKeyState = (currentKeyState * 33 + cipherByte + keyByte) & 0xFF;
        }

        const vEnv = generateRandomVarName();
        const vKey = generateRandomVarName();
        const vData = generateRandomVarName();
        const vOut = generateRandomVarName();
        const vState = generateRandomVarName();
        const vI = generateRandomVarName();
        const vB = generateRandomVarName();
        const vK = generateRandomVarName();
        const vFn = generateRandomVarName();
        const vBit = generateRandomVarName();
        const vStr = generateRandomVarName();
        const vExec = generateRandomVarName();

        const keyCharCodes = symbolKey
            .split('')
            .map(c => `string.char(${c.charCodeAt(0)})`)
            .join('..');

        const bytesFormatted = `{${encryptedBytes.join(',')}}`;

        return `--// Z-Protector Heavy Rolling-Cipher Engine
local ${vEnv} = getfenv and getfenv() or _ENV or {}
local ${vBit} = ${vEnv}.bit32 or bit32
local ${vKey} = ${keyCharCodes}
local ${vData} = ${bytesFormatted}
local ${vOut} = {}
local ${vState} = 0x5A

for ${vI} = 1, #${vData} do
    local ${vK} = string.byte(${vKey}, ((${vI} - 1) % #${vKey}) + 1)
    local ${vB} = ${vData}[${vI}]
    
    local _dec = ${vBit}.bxor(${vB}, ${vK}, ${vState})
    ${vOut}[${vI}] = string.char(_dec)
    
    ${vState} = (${vState} * 33 + ${vB} + ${vK}) % 256
end

local ${vStr} = table.concat(${vOut})
local ${vFn} = loadstring or ${vEnv}.loadstring or getgenv().loadstring
local ${vExec}, err = ${vFn}(${vStr})

if not ${vExec} then
    error("[Z-Protector Error]: " .. tostring(err))
end

return ${vExec}()`;
    }
}

module.exports = CodeGenerator;
