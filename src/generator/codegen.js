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

        // Cifrado Rolling Key
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
        const vCheck = generateRandomVarName();
        const vBxor = generateRandomVarName();

        const keyCharCodes = symbolKey
            .split('')
            .map(c => `string.char(${c.charCodeAt(0)})`)
            .join('..');

        const bytesFormatted = `{${encryptedBytes.join(',')}}`;

        return `--// Z-Protector Heavy Rolling-Cipher Engine
local ${vEnv} = getfenv and getfenv() or _ENV or {}

local ${vCheck} = function(f)
    if typeof(f) ~= "function" then return false end
    local info = debug and debug.getinfo and debug.getinfo(f)
    return info and info.what == "C"
end

local ${vKey} = ${keyCharCodes}
local ${vData} = ${bytesFormatted}
local ${vOut} = {}
local ${vState} = 0x5A
local ${vBxor} = (${vEnv}.bit32 and ${vEnv}.bit32.bxor) or bxor

for ${vI} = 1, #${vData} do
    local ${vK} = string.byte(${vKey}, ((${vI} - 1) % #${vKey}) + 1)
    local ${vB} = ${vData}[${vI}]
    
    local _dec = ${vBxor}(${vB}, ${vK}, ${vState})
    ${vOut}[${vI}] = string.char(_dec)
    
    ${vState} = (${vState} * 33 + ${vB} + ${vK}) % 256
end

local ${vFn} = loadstring or ${vEnv}.loadstring
if ${vCheck} and not ${vCheck}(${vFn}) then
    return function() end
end

return ${vFn}(table.concat(${vOut}))()`;
    }
}

module.exports = CodeGenerator;
