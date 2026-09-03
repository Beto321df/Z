// Codifica strings a bytes escapados (\112\114\105...) para ocultar el texto
function encodeLuaString(str) {
    if (typeof str !== 'string') return String(str);
    let bytes = [];
    for (let i = 0; i < str.length; i++) {
        bytes.push('\\' + str.charCodeAt(i));
    }
    return '"' + bytes.join('') + '"';
}

// Convierte las estructuras de JS a Tablas de Luau con Opcodes Numéricos
function toObfuscatedLuaTable(data) {
    if (data === null || data === undefined) return 'nil';
    if (typeof data === 'boolean' || typeof data === 'number') return String(data);
    if (typeof data === 'string') return encodeLuaString(data);

    if (Array.isArray(data)) {
        return '{' + data.map(toObfuscatedLuaTable).join(',') + '}';
    }

    if (typeof data === 'object') {
        // Mapeo de Opcodes a Números
        let opCode = 0;
        let p1 = 0;
        let p2 = 0;

        if (data.op === 'GETGLOBAL') {
            opCode = 31;
            p1 = data.reg || 1;
            p2 = encodeLuaString(data.name || '');
        } else if (data.op === 'LOADK' || data.op === 'LOADCONST') {
            opCode = 42;
            p1 = data.reg || 1;
            p2 = typeof data.val === 'string' ? encodeLuaString(data.val) : (data.val || 0);
        } else if (data.op === 'CALL') {
            opCode = 89;
            p1 = data.func || 1;
            p2 = data.args || 0;
        } else if (data.op === 'SETGLOBAL') {
            opCode = 63;
            p1 = encodeLuaString(data.name || '');
            p2 = data.reg || 1;
        } else {
            opCode = typeof data.op === 'number' ? data.op : 10;
            p1 = data.reg || data[2] || 0;
            p2 = data.val || data.name || data[3] || 0;
            if (typeof p2 === 'string') p2 = encodeLuaString(p2);
        }

        return '{' + opCode + ',' + p1 + ',' + p2 + '}';
    }

    return String(data);
}

class LuauInterpreterGenerator {
    generateRunner(bytecode) {
        const luaBytecode = toObfuscatedLuaTable(bytecode);

        // VM con variables ofuscadas (_0x...) compatible con Luau
        return `local _0x1a = ${luaBytecode}

local function _0x8b(_0x2c)
    if not _0x2c then return end
    local _0x3f = 1
    local _0x4e = {}
    local _0x5a = getfenv and getfenv() or _ENV
    
    while _0x3f <= #_0x2c do
        local _0x6d = _0x2c[_0x3f]
        if not _0x6d then break end
        
        local _0x7e = _0x6d[1]
        
        if _0x7e == 31 then
            _0x4e[_0x6d[2]] = _0x5a[_0x6d[3]]
        elseif _0x7e == 42 then
            _0x4e[_0x6d[2]] = _0x6d[3]
        elseif _0x7e == 89 then
            local _0x8f = _0x6d[2]
            local _0x9a = _0x6d[3] or 0
            local _0x0b = {}
            for _0x1c = 1, _0x9a do
                table.insert(_0x0b, _0x4e[_0x8f + _0x1c])
            end
            local _0x2d = _0x4e[_0x8f]
            if type(_0x2d) == "function" then
                _0x2d(unpack(_0x0b))
            end
        elseif _0x7e == 63 then
            _0x5a[_0x6d[2]] = _0x4e[_0x6d[3]]
        end
        
        _0x3f = _0x3f + 1
    end
end

_0x8b(_0x1a)`;
    }
}

module.exports = LuauInterpreterGenerator;
