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

        const formattedConstants = '{' + constants.map(c => {
            if (typeof c === 'string') return stringToLuaBytes(c);
            if (c === null || c === undefined) return 'nil';
            if (typeof c === 'boolean' || typeof c === 'number') return String(c);
            return 'nil';
        }).join(',') + '}';

        const formattedInstructions = '{' + (Array.isArray(instructions) ? instructions.map(inst => {
            if (Array.isArray(inst)) {
                return '{' + inst.map(n => typeof n === 'number' ? n : 0).join(',') + '}';
            }
            if (typeof inst === 'object' && inst !== null) {
                return '{' + (inst.op || 0) + ',' + (inst.a || 0) + ',' + (inst.b || 0) + ',' + (inst.c || 0) + '}';
            }
            return '{0,0,0,0}';
        }).join(',') : '') + '}';

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
                local glob = _0xE[_0xKey]
                if glob == nil and _0xKey == "loadstring" then
                    glob = loadstring or load or (getgenv and getgenv().loadstring)
                end
                _0xR[_0xA] = glob
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
                _0xR[_0xA] = _0xTarget[_0xKey]
            end

        elseif _0xOP == 6 then -- SETTABLE
            local _0xTarget = _0xR[_0xA]
            local _0xKey = type(_0xB) == "number" and _0xgetC(_0xB) or _0xR[_0xB]
            local _0xVal = type(_0xC_) == "number" and _0xgetC(_0xC_) or _0xR[_0xC_]
            if _0xTarget ~= nil and _0xKey ~= nil then
                _0xTarget[_0xKey] = _0xVal
            end

        elseif _0xOP == 7 then -- NEWTABLE
            _0xR[_0xA] = {}

        elseif _0xOP == 8 then -- CALL
            local _0xFunc = _0xR[_0xA]
            if type(_0xFunc) ~= "function" then
                error("[Z-Protector VM Error]: Intento de llamar un valor " .. type(_0xFunc) .. " en el registro " .. tostring(_0xA))
            end
            
            local _0xArgs = {}
            if type(_0xB) == "number" and _0xB > 1 then
                for _0xi = 1, _0xB - 1 do
                    table.insert(_0xArgs, _0xR[_0xA + _0xi])
                end
            end
            
            local _0xRes = {_0xFunc(unpack(_0xArgs))}
            
            if _0xRes[1] == nil and _0xRes[2] ~= nil then
                error("[Z-Protector Load Error]: " .. tostring(_0xRes[2]))
            end

            if type(_0xC_) == "number" and _0xC_ > 1 then
                for _0xi = 1, _0xC_ - 1 do
                    _0xR[_0xA + _0xi - 1] = _0xRes[_0xi]
                end
            else
                _0xR[_0xA] = _0xRes[1]
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

_0xVM(_0xI, _0xK)`;
    }
}

module.exports = LuauInterpreterGenerator;
