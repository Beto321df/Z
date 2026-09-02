/**
 * Z-PROTECTOR CUSTOM ENGINE (DE CERO)
 * Convierte código Lua a un sistema de símbolos dinámicos.
 */

// Alfabeto de símbolos para tu idioma personalizado
const SYMBOL_SET = [
    '>', '×', '&', '2', ',', '/', '*', '#', '$', '8', ';', ':', '!', '%',
    '^', '(', ')', '-', '_', '=', '+', '[', ']', '{', '}', '|', '<', '?', '~'
];

function generateRandomName() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    let name = '_z' + chars[Math.floor(Math.random() * chars.length)];
    for (let i = 0; i < 6; i++) {
        name += chars[Math.floor(Math.random() * chars.length)];
    }
    return name;
}

export function obfuscateCustom(sourceCode) {
    if (!sourceCode || typeof sourceCode !== 'string') {
        throw new Error('El código fuente debe ser un texto válido.');
    }

    // 1. Convertir el código fuente a bytes UTF-8
    const inputBytes = Buffer.from(sourceCode, 'utf-8');

    // 2. Generar mapa único de tokens de 2 símbolos para cada byte (0-255)
    // Esto crea combinaciones como ">×", "&2", "/*", "#$" para representar cada byte
    const byteToSymbolMap = {};
    const symbolToByteTable = [];
    const usedTokens = new Set();

    for (let i = 0; i < 256; i++) {
        let token = '';
        do {
            const sym1 = SYMBOL_SET[Math.floor(Math.random() * SYMBOL_SET.length)];
            const sym2 = SYMBOL_SET[Math.floor(Math.random() * SYMBOL_SET.length)];
            token = sym1 + sym2;
        } while (usedTokens.has(token));

        usedTokens.add(token);
        byteToSymbolMap[i] = token;
        symbolToByteTable.push(token);
    }

    // 3. Traducir los bytes del script al idioma de símbolos
    let encodedStream = '';
    for (let i = 0; i < inputBytes.length; i++) {
        encodedStream += byteToSymbolMap[inputBytes[i]];
    }

    // 4. Generar variables aleatorias para el runtime de Luau
    const vStream = generateRandomName();
    const vDict = generateRandomName();
    const vTable = generateRandomName();
    const vIndex = generateRandomName();
    const vToken = generateRandomName();
    const vLoad = generateRandomName();
    const vFunc = generateRandomName();
    const vErr = generateRandomName();
    const vEnv = generateRandomName();

    // 5. Construir la tabla de mapeo en Lua
    const luaDictItems = symbolToByteTable.map((tok, idx) => `["${tok}"]=${idx}`).join(',');

    // 6. Runtime optimizado para soportar 5000+ líneas sin ralentizar la ejecución
    const luauRuntime = `local ${vEnv}=(getgenv or function() return _G end)();` +
`local ${vLoad}=${vEnv}.loadstring or loadstring;` +
`local ${vDict}={${luaDictItems}};` +
`local ${vStream}="${encodedStream}";` +
`local ${vTable}={};` +
`for ${vIndex}=1,#${vStream},2 do ` +
`local ${vToken}=string.sub(${vStream},${vIndex},${vIndex}+1);` +
`${vTable}[#${vTable}+1]=string.char(${vDict}[${vToken}]);` +
`end;` +
`local ${vFunc},${vErr}=${vLoad}(table.concat(${vTable}));` +
`if not ${vFunc} then error("[Z-Protector Custom]: "..tostring(${vErr})) end;` +
`return ${vFunc}();`;

    return luauRuntime;
}
