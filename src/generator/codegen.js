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
    generate(vmData) {
        const varEnv = generateRandomVarName();
        const varBytecode = generateRandomVarName();
        const varIndex = generateRandomVarName();
        const varInst = generateRandomVarName();
        const varFn = generateRandomVarName();

        // Extraer bytecode y stringTable
        const bytecodeArr = (vmData && vmData.bytecode) ? vmData.bytecode : [];
        const stringEntries = (vmData && vmData.stringTable) ? vmData.stringTable : [];

        // Generar decodificación de strings en la tabla de entorno
        let stringDecoderCode = '';
        stringEntries.forEach(([key, val]) => {
            const charCodes = String(val)
                .split('')
                .map(c => `string.char(${c.charCodeAt(0)})`)
                .join('..');
            stringDecoderCode += `${varEnv}["${key}"] = ${charCodes || '""'}\n`;
        });

        // Convertir bytecode JSON a formato de tabla Luau { { ... } }
        const formattedBytecode = JSON.stringify(bytecodeArr)
            .replace(/\[/g, '{')
            .replace(/\]/g, '}');

        return `--// Z-Protector Custom VM Engine (Luau Compatible)
local ${varEnv} = getfenv and getfenv() or _ENV or {}

${stringDecoderCode}
local ${varBytecode} = ${formattedBytecode}
local ${varIndex} = 1

while ${varIndex} <= #${varBytecode} do
    local ${varInst} = ${varBytecode}[${varIndex}]
    if ${varInst}[1] == 1 then
        ${varEnv}[${varInst}[2]] = ${varInst}[3]
    elseif ${varInst}[1] == 2 then
        local ${varFn} = ${varEnv}[${varInst}[2]] or print
        ${varFn}(${varEnv}[${varInst}[3]] or ${varInst}[3])
    end
    ${varIndex} = ${varIndex} + 1
end`;
    }
}

module.exports = CodeGenerator;
