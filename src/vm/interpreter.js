// Convierte cualquier string a bytes UTF-8 reales (0-255) seguros para Luau
function stringToLuaBytes(str) {
    if (typeof str !== 'string') return String(str);
    if (str.length === 0) return '""';
    
    const buf = Buffer.from(str, 'utf-8');
    const bytes = Array.from(buf);
    
    return `_0xS({${bytes.join(',')}})`;
}

class LuauInterpreterGenerator {
    generateRunner(bytecode) {
        const constants = bytecode.constants || [];
        const instructions = bytecode.instructions || (Array.isArray(bytecode) ? bytecode : []);

        // Formatear la tabla de constantes (_K)
        const formattedConstants = '{' + constants.map(c => {
            if (typeof c === 'string') return stringToLuaBytes(c);
            if (c === null || c === undefined) return 'nil';
            if (typeof c === 'boolean' || typeof c === 'number') return String(c);
            return 'nil';
        }).join(',') + '}';

        // Formatear las instrucciones de la VM (_I)
        const formattedInstructions = '{' + (Array.isArray(instructions) ? instructions.map(inst => {
            if (Array.isArray(inst)) {
                return '{' + inst.map(n => typeof n === 'number' ? n : 0).join(',') + '}';
            }
            if (typeof inst === 'object' && inst !== null) {
                return '{' + (inst.op || 0) + ',' + (inst.a || 0) + ',' + (inst.b || 0) + ',' + (inst.c || 0) + '}';
            }
            return '{0,0,0,0}';
        }).join(',') : '') + '}';

        // Runner de VM compatible con 0-index y 1-index en Luau
        return `local function _0xS(b)
    if type(b) == "string" then return b end
    if type(b) ~= "table" then return "" end
    local t = {}
    for i = 1, #b do
        local val = tonumber(b[i]) or 0
        if val >= 0 and val <= 255 then
            t[#t + 1] = string.char(val)
        end
    end
    return table.concat(t)
end

local _0xK = ${formattedConstants}
local _0xI = ${formattedInstructions}

local function _0xVM(_0xInst, _0xConst)
    local _0xPC = 1
    local _0xR = {}
    local _0xE = getfenv and getfenv() or _ENV

    -- Helper para resolver constantes convirtiendo índices 0-based (JS) a 1-based (Lua)
    local function _0xgetC(idx)
        if idx == nil then return nil end
        if _0xConst[idx] ~= nil then return _0xConst[idx] end
        if type(idx) == "number" and _0xConst[idx + 1] ~= nil then return _0xConst[idx + 1] end
        return nil
    end

    while true do
        local _0xC = _0xInst[_0xPC]
        if not _0xC then break end
        
        local _0xOP = _0xC[1]
        local _0xA  = _0xC[2]
        local _0xB  = _0xC[3]
        local _0xC_ = _0xC[4]
        
        if _0xOP == 1 then -- MOVE
            _0xR[_0xA] = _0xR[_0xB]

        elseif _0xOP == 2 then -- LOADK
            _0xR[_0xA] = _0xgetC(_0xB)

        elseif _0xOP == 3 then -- GETGLOBAL
            local _0xKey = _0xgetC(_0xB)
            if _0xKey ~= nil then
                _0xR[_0xA] = _0xE[_0xKey]
            end

        elseif _0xOP == 4 then -- SETGLOBAL
            local _0xKey = _0xgetC(_0xB)
            if _0xKey ~= nil then
                _0xE[_0xKey] = _0xR[_0xA]
            end

        elseif _0xOP == 5 then -- GETTABLE
            local _0xTarget = _0xR[_0xB]
            local _0xKey = type(_0xC_) == "number" and _0xgetC(_0xC_) or _0xR[_0xC_]
            
            if _0xTarget ~= nil and _0xKey ~= nil then
                local success, result = pcall(function() return _0xTarget[_0xKey] end)
                if success then
                    _0xR[_0xA] = result
                else
                    _0xR[_0xA] = nil
                end
            else
                _0xR[_0xA] = nil
            end

        elseif _0xOP == 6 then -- SETTABLE
            local _0xTarget = _0xR[_0xA]
            local _0xKey = type(_0xB) == "number" and _0xgetC(_0xB) or _0xR[_0xB]
            local _0xVal = type(_0xC_) == "number" and _0xgetC(_0xC_) or _0xR[_0xC_]
            
            if _0xTarget ~= nil and _0xKey ~= nil then
                pcall(function() _0xTarget[_0xKey] = _0xVal end)
            end

        elseif _0xOP == 7 then -- NEWTABLE
            _0xR[_0xA] = {}

        elseif _0xOP == 8 then -- CALL
            local _0xFunc = _0xR[_0xA]
            if type(_0xFunc) == "function" then
                local _0xArgs = {}
                if type(_0xB) == "number" and _0xB > 1 then
                    for _0xi = 1, _0xB - 1 do
                        table.insert(_0xArgs, _0xR[_0xA + _0xi])
                    end
                end
                local success, _0xRes = pcall(function() return {_0xFunc(unpack(_0xArgs))} end)
                if success and type(_0xRes) == "table" then
                    if type(_0xC_) == "number" and _0xC_ > 1 then
                        for _0xi = 1, _0xC_ - 1 do
                            _0xR[_0xA + _0xi - 1] = _0xRes[_0xi]
                        end
                    end
                end
            end

        elseif _0xOP == 9 then -- RETURN
            if _0xB == 1 then return end
            local _0xRet = {}
            if type(_0xA) == "number" and type(_0xB) == "number" then
                for _0xi = _0xA, _0xA + _0xB - 2 do
                    table.insert(_0xRet, _0xR[_0xi])
                end
            end
            return unpack(_0xRet)

        elseif _0xOP == 10 then -- JMP
            if type(_0xA) == "number" then
                _0xPC = _0xPC + _0xA
            end
        end
        
        _0xPC = _0xPC + 1
    end
end

return _0xVM(_0xI, _0xK)`;
    }
}

module.exports = LuauInterpreterGenerator;
