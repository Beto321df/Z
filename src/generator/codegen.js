// Generador de nombres de variables válidos para el entorno de Luau
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
        // Asegurar que recibimos el string del script
        const codeToObfuscate = typeof rawLuaCode === 'string' 
            ? rawLuaCode 
            : (rawLuaCode && rawLuaCode.source) || 'print("Z-Protector Loaded")';

        // Clave de cifrado basada en tu set de símbolos
        const symbolKey = "/.;,['\\]=-0987654321//?";
        
        // Cifrado XOR del script completo
        const encryptedBytes = [];
        for (let i = 0; i < codeToObfuscate.length; i++) {
            const charCode = codeToObfuscate.charCodeAt(i);
            const keyCode = symbolKey.charCodeAt(i % symbolKey.length);
            encryptedBytes.push(charCode ^ keyCode);
        }

        // Crear nombres aleatorios para el runtime
        const varEnv = generateRandomVarName();
        const varData = generateRandomVarName();
        const varKey = generateRandomVarName();
        const varResult = generateRandomVarName();
        const varIndex = generateRandomVarName();
        const varLoad = generateRandomVarName();

        // Convertir la clave de símbolos a bytes string.char
        const keyCharCodes = symbolKey
            .split('')
            .map(c => `string.char(${c.charCodeAt(0)})`)
            .join('..');

        // Formatear los bytes cifrados en tabla de Luau
        const bytesFormatted = `{${encryptedBytes.join(',')}}`;

        // Generar script ofuscado final para Roblox
        return `--// Z-Protector Heavy Obfuscator Engine (Luau 3000+ Lines Compatible)
local ${varEnv} = getfenv and getfenv() or _ENV or {}
local ${varKey} = ${keyCharCodes}
local ${varData} = ${bytesFormatted}
local ${varResult} = {}

for ${varIndex} = 1, #${varData} do
    local _k = string.byte(${varKey}, ((${varIndex} - 1) % #${varKey}) + 1)
    local _b = ${varEnv}.bit32 and ${varEnv}.bit32.bxor(${varData}[${varIndex}], _k) or (${varData}[${varIndex}] ~ _k)
    ${varResult}[${varIndex}] = string.char(_b)
end

local ${varLoad} = assert(loadstring or ${varEnv}.loadstring)(table.concat(${varResult}))
return ${varLoad}()`;
    }
}

module.exports = CodeGenerator;
