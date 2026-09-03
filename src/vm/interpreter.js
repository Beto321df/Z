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

        return `local _BYTECODE = ${luaBytecode}

local function _execute(code)
    if not code then return end
    
    local pc = 1
    local stack = {}
    local env = getfenv and getfenv() or _ENV
    
    while pc <= #code do
        local inst = code[pc]
        if not inst then break end
        
        local op = inst.op or inst[1]
        
        -- Interpretación de opcodes de la VM
        if op == "GETGLOBAL" or op == 1 then
            local reg = inst.reg or inst[2]
            local name = inst.name or inst[3]
            stack[reg] = env[name]
        elseif op == "LOADK" or op == "LOADCONST" or op == 2 then
            local reg = inst.reg or inst[2]
            local val = inst.val or inst[3]
            stack[reg] = val
        elseif op == "CALL" or op == 3 then
            local funcReg = inst.func or inst[2]
            local argCount = inst.args or inst[3] or 0
            local args = {}
            for i = 1, argCount do
                table.insert(args, stack[funcReg + i])
            end
            local func = stack[funcReg]
            if type(func) == "function" then
                func(unpack(args))
            end
        elseif op == "SETGLOBAL" or op == 4 then
            local name = inst.name or inst[2]
            local reg = inst.reg or inst[3]
            env[name] = stack[reg]
        end
        
        pc = pc + 1
    end
end

_execute(_BYTECODE)`;
    }
}

module.exports = LuauInterpreterGenerator;
