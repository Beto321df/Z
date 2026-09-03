function generateRandomVarName(length = 15) {
    // Solo caracteres válidos para identificadores en Luau/Lua
    const firstChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    const allChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
    
    let result = firstChars[Math.floor(Math.random() * firstChars.length)];
    for (let i = 1; i < length - 1; i++) {
        result += allChars[Math.floor(Math.random() * allChars.length)];
    }
    return result;
}
