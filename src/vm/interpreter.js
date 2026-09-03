function toLuaTable(data) {
    if (data === null || data === undefined) {
        return 'nil';
    }
    if (Array.isArray(data)) {
        return `{ ${data.map(toLuaTable).join(', ')} }`;
    }
    if (typeof data === 'object') {
        const entries = Object.entries(data).map(([k, v]) => `[${JSON.stringify(k)}] = ${toLuaTable(v)}`);
        return `{ ${entries.join(', ')} }`;
    }
    if (typeof data === 'string') {
        return JSON.stringify(data);
    }
    return String(data);
}

class LuauInterpreterGenerator {
    generateRunner(bytecode) {
        const luaBytecode = toLuaTable(bytecode);

        // Código Luau limpio, empieza directamente con local
        return `local _BYTECODE = ${luaBytecode}

local function _execute(code)
    if not code then return end
    local pc = 1
    local stack = {}
    local env = getfenv and getfenv() or _ENV
    
    while pc <= #code do
        local inst = code[pc]
        if not inst then break end
        
        -- Lógica de opcodes
        pc = pc + 1
    end
end

return _execute(_BYTECODE)`;
    }
}

module.exports = LuauInterpreterGenerator;
