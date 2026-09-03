// Función para codificar constantes en cadenas de bytes escapados
function stringToLuaBytes(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += '\\' + str.charCodeAt(i);
    }
    return '"' + result + '"';
}

class LuauInterpreterGenerator {
    generateRunner(bytecode) {
        // Estructura de Bytecode estilo Luraph:
        // [1] Tabla de Constantes (_K)
        // [2] Tabla de Instrucciones (_I)
        
        const constants = bytecode.constants || [];
        const instructions = bytecode.instructions || bytecode;

        // Formatear tabla de constantes a sintaxis Lua
        const formattedConstants = '{' + constants.map(c => {
            if (typeof c === 'string') return stringToLuaBytes(c);
            if (c === null || c === undefined) return 'nil';
            return String(c);
        }).join(',') + '}';

        // Formatear instrucciones [OpCode, A, B, C]
        const formattedInstructions = '{' + (Array.isArray(instructions) ? instructions.map(inst => {
            if (Array.isArray(inst)) return '{' + inst.join(',') + '}';
            if (typeof inst === 'object') {
                return '{' + (inst.op || 0) + ',' + (inst.a || 0) + ',' + (inst.b || 0) + ',' + (inst.c || 0) + '}';
            }
            return '{0,0,0,0}';
        }).join(',') : '') + '}';

        // Bucle de la Máquina Virtual (VM Runner estilo Luraph)
        return `local _0xK = ${formattedConstants}
local _0xI = ${formattedInstructions}

local function _0xVM(_0xInst, _0xConst)
    local _0xPC = 1
    local _0xR = {}
    local _0xE = getfenv and getfenv() or _ENV
    
    while true do
        local _0xC = _0xInst[_0xPC]
        if not _0xC then break end
        
        local _0xOP = _0xC[1]
        local _0xA  = _0xC[2]
        local _0xB  = _0xC[3]
        local _0xC_ = _0xC[4]
        
        -- Mapping de Opcodes estilo Luraph
        if _0xOP == 1 then -- MOVE: Stack[A] = Stack[B]
            _0xR[_0xA] = _0xR[_0xB]

        elseif _0xOP == 2 then -- LOADK: Stack[A] = Const[B]
            _0xR[_0xA] = _0xConst[_0xB]

        elseif _0xOP == 3 then -- GETGLOBAL: Stack[A] = Env[Const[B]]
            _0xR[_0xA] = _0xE[_0xConst[_0xB]]

        elseif _0xOP == 4 then -- SETGLOBAL: Env[Const[B]] = Stack[A]
            _0xE[_0xConst[_0xB]] = _0xR[_0xA]

        elseif _0xOP == 5 then -- GETTABLE: Stack[A] = Stack[B][Const[C] or Stack[C]]
            local _0xKey = type(_0xC_) == "number" and _0xConst[_0xC_] or _0xR[_0xC_]
            _0xR[_0xA] = _0xR[_0xB][_0xKey]

        elseif _0xOP == 6 then -- SETTABLE: Stack[A][Key] = Stack[C]
            local _0xKey = type(_0xB) == "number" and _0xConst[_0xB] or _0xR[_0xB]
            local _0xVal = type(_0xC_) == "number" and _0xConst[_0xC_] or _0xR[_0xC_]
            _0xR[_0xA][_0xKey] = _0xVal

        elseif _0xOP == 7 then -- NEWTABLE: Stack[A] = {}
            _0xR[_0xA] = {}

        elseif _0xOP == 8 then -- CALL: Exec Stack[A]
            local _0xFunc = _0xR[_0xA]
            if type(_0xFunc) == "function" then
                local _0xArgs = {}
                if _0xB > 1 then
                    for _0xi = 1, _0xB - 1 do
                        table.insert(_0xArgs, _0xR[_0xA + _0xi])
                    end
                end
                local _0xRes = {_0xFunc(unpack(_0xArgs))}
                if _0xC_ > 1 then
                    for _0xi = 1, _0xC_ - 1 do
                        _0xR[_0xA + _0xi - 1] = _0xRes[_0xi]
                    end
                end
            end

        elseif _0xOP == 9 then -- RETURN: Retorna valores
            if _0xB == 1 then return end
            local _0xRet = {}
            for _0xi = _0xA, _0xA + _0xB - 2 do
                table.insert(_0xRet, _0xR[_0xi])
            end
            return unpack(_0xRet)

        elseif _0xOP == 10 then -- JMP: Salto relativo de PC
            _0xPC = _0xPC + _0xA
        end
        
        _0xPC = _0xPC + 1
    end
end

return _0xVM(_0xI, _0xK)`;
    }
}

module.exports = LuauInterpreterGenerator;
