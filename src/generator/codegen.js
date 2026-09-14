const luaparse = require('luaparse');

class CodeGenerator {
    generate(rawLuaCode) {
        const source = typeof rawLuaCode === 'string' ? rawLuaCode : rawLuaCode.source;
        if (typeof source !== 'string' || !source.trim()) {
            throw new Error('El código Lua/Luau está vacío.');
        }

        // Validamos Lua clásico cuando es posible, pero no bloqueamos Luau
        // porque Roblox admite sintaxis que luaparse 0.3.1 no conoce.
        try {
            luaparse.parse(source, { wait: false, luaVersion: '5.1' });
        } catch (_) {
            // La ejecución final seguirá usando el código original tal cual.
        }

        // Z-Protector usa su propio empaquetado: no XOR, no librerías de
        // ofuscación externas y sin depender de nuestro VM experimental.
        // Cada byte recibe una transformación distinta y el resultado final
        // se entrega en UNA sola línea para evitar runners enormes de 97+ líneas.
        const bytes = Buffer.from(source, 'utf8');
        const key = Math.floor(Math.random() * 240) + 16;
        const encoded = new Array(bytes.length);

        for (let i = 0; i < bytes.length; i++) {
            encoded[i] = (bytes[i] + key + ((i + 1) * 7)) & 255;
        }

        const data = encoded.join(',');
        return `local k=${key};local b={${data}};local c={};for i=1,#b do c[i]=string.char((b[i]-k-(i*7))%256) end;local s=table.concat(c);local L=loadstring or load;if not L then error("Z-Protector: loadstring no disponible") end;local f,err=L(s);if not f then error(err) end;return f()`;
    }
}

module.exports = CodeGenerator;
