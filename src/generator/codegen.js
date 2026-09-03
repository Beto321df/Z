// Generador de nombres de variables válidos en Luau (15 caracteres)
function generateRandomVarName(length = 15) {
    const firstChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    const allChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
    
    let result = firstChars[Math.floor(Math.random() * firstChars.length)];
    for (let i = 1; i < length; i++) {
        result += allChars[Math.floor(Math.random() * allChars.length)];
    }
    return result;
}

class CodeGenerator {
    generate(vmCode) {
        // Generar nombres de variables 100% compatibles con Luau
        const varEnv = generateRandomVarName();
        const varBytecode = generateRandomVarName();
        const varIndex = generateRandomVarName();
        const varInst = generateRandomVarName();
        const varFn = generateRandomVarName();

        // Asegurar que el bytecode se convierta a formato de tabla de Lua: { { ... } }
        let formattedBytecode = vmCode;
        if (typeof vmCode === 'object') {
            formattedBytecode = JSON.stringify(vmCode)
                .replace(/\[/g, '{')
                .replace(/\]/g, '}');
        } else if (typeof vmCode === 'string' && vmCode.startsWith('[')) {
            formattedBytecode = vmCode
                .replace(/\[/g, '{')
                .replace(/\]/g, '}');
        }

        // Ensamblar código final en Luau
        return `--// Z-Protector Custom VM Engine (Luau Compatible)
local ${varEnv} = getfenv and getfenv() or _ENV or {}
local ${varBytecode} = ${formattedBytecode || '{ {2, "print", "Hola desde Roblox"} }'}

local ${varIndex} = 1
while ${varIndex} <= #${varBytecode} do
    local ${varInst} = ${varBytecode}[${varIndex}]
    if ${varInst}[1] == 1 then
        ${varEnv}[${varInst}[2]] = ${varInst}[3]
    elseif ${varInst}[1] == 2 then
        local ${varFn} = ${varEnv}[${varInst}[2]] or print
        ${varFn}(${varInst}[3])
    end
    ${varIndex} = ${varIndex} + 1
end`;
    }
}

module.exports = CodeGenerator;
