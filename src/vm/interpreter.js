function generateRandomVarName(length = 15) {
    const firstChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    const allChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
    let result = firstChars[Math.floor(Math.random() * firstChars.length)];
    for (let i = 1; i < length; i++) {
        result += allChars[Math.floor(Math.random() * allChars.length)];
    }
    return result;
}

class VMInterpreterGenerator {
    generate(bytecode, stringTable) {
        // Devuelve un objeto estructurado limpio en lugar de un string de código plano
        return {
            bytecode: bytecode || [],
            stringTable: stringTable ? Array.from(stringTable.entries()) : []
        };
    }
}

module.exports = VMInterpreterGenerator;
