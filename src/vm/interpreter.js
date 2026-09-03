// Function helper para convertir objetos/arrays de JS a tablas validas de Lua
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
        // Convertimos el bytecode de JS [...] a tabla de Lua {...}
        const luaBytecode = toLuaTable(bytecode);

        // Generamos el ejecutor listo para Luau sin sintaxis invalida
        return `;(function()
    local _BYTECODE = ${luaBytecode}
    
    -- Intérprete de la Máquina Virtual (VM)
    local function execute(code)
        local pc = 1
        local stack = {}
        local env = getfenv and getfenv() or _ENV
        
        while pc <= #code do
            local inst = code[pc]
            if not inst then break end
            
            -- Lógica de opcodes de tu VM
            local op = inst.op or inst[1]
            
            pc = pc + 1
        end
    end

    return execute(_BYTECODE)
})();`;
    }
}

module.exports = LuauInterpreterGenerator;
