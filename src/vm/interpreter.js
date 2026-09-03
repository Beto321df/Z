const { OPCODES } = require('./compiler.js');

class LuauInterpreterGenerator {
    generateRunner(bytecode) {
        const constsJson = JSON.stringify(bytecode.constants);
        const instsJson = JSON.stringify(bytecode.instructions);

        // Intérprete Luau Custom
        return `local _C = ${constsJson}
local _I = ${instsJson}
local _R = {}
local _G = getfenv and getfenv() or _ENV or _G
local _P = 1

while _P <= #_I do
    local _e = _I[_P]
    local _op = _e[1]
    
    if _op == ${OPCODES.LOADCONST} then
        _R[_e[2]] = _C[_e[3] + 1]
    elseif _op == ${OPCODES.GETGLOBAL} then
        _R[_e[2]] = _G[_C[_e[3] + 1]]
    elseif _op == ${OPCODES.CALL} then
        local _fn = _R[_e[2]]
        local _args = {}
        for i = 1, _e[3] do
            table.insert(_args, _R[i])
        end
        _fn(unpack(_args))
    elseif _op == ${OPCODES.RETURN} then
        break
    end
    _P = _P + 1
end`;
    }
}

module.exports = LuauInterpreterGenerator;
