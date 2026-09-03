function randName() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
}

function randOpcode() {
    return Math.floor(Math.random() * 80000) + 10000;
}

function obfuscateNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    const r1 = Math.floor(Math.random() * 400000) + 100000;
    const r2 = Math.floor(Math.random() * 400000) + 100000;
    const res = num + r1 - r2;
    return `((${res} - ${r1}) + ${r2})`;
}

function stringToLuraphFunc(str) {
    if (typeof str !== 'string') return 'nil';
    const buf = Buffer.from(str, 'utf-8');
    const bytes = Array.from(buf);
    
    const vByte = randName();
    const vIdx = randName();
    const obfBytes = bytes.map(b => obfuscateNumber(b)).join(',');
    
    return `(function() local ${vByte}={${obfBytes}}; local ${vIdx}={}; for i=1,#${vByte} do ${vIdx}[i]=string.char(${vByte}[i]) end; return table.concat(${vIdx}) end)()`;
}

class LuauInterpreterGenerator {
    generateRunner(bytecode) {
        const constants = bytecode.constants || [];
        const rawInstructions = bytecode.instructions || [];

        // Mapeo dinámico de Opcodes a Números Aleatorios (Luraph Mapping)
        const OP_MAP = {
            'LOADK': randOpcode(),
            'GETGLOBAL': randOpcode(),
            'SETGLOBAL': randOpcode(),
            'GETTABLE': randOpcode(),
            'SETTABLE': randOpcode(),
            'NEWTABLE': randOpcode(),
            'CALL': randOpcode(),
            'RETURN': randOpcode()
        };

        // Formatear tabla de constantes con encriptación matemática
        const formattedConstants = '{' + constants.map(c => {
            if (typeof c === 'string') return stringToLuraphFunc(c);
            if (typeof c === 'number') return obfuscateNumber(c);
            if (typeof c === 'boolean') return String(c);
            return 'nil';
        }).join(',') + '}';

        // Formatear instrucciones sustituyendo nombres por Opcodes Aleatorios
        const formattedInstructions = '{' + rawInstructions.map(inst => {
            const opName = inst[0];
            const opCode = OP_MAP[opName] || randOpcode();
            const a = obfuscateNumber(inst[1] || 0);
            const b = obfuscateNumber(inst[2] || 0);
            const c = obfuscateNumber(inst[3] || 0);
            return `{${opCode},${a},${b},${c}}`;
        }).join(',') + '}';

        // Nombres de variables aleatorios para la VM
        const v_K = randName();
        const v_I = randName();
        const v_VM = randName();
        const v_PC = randName();
        const v_R = randName();
        const v_E = randName();
        const v_Inst = randName();
        const v_OP = randName();
        const v_A = randName();
        const v_B = randName();
        const v_C = randName();
        const v_State = randName();
        const v_Junk = randName();

        // VM Runner con Control Flow Flattening (CFF)
        return `local ${v_K} = ${formattedConstants}
local ${v_I} = ${formattedInstructions}

local function ${v_VM}(${v_Inst}, ${v_K})
    local ${v_PC} = 1
    local ${v_R} = {}
    local ${v_E} = getfenv and getfenv() or _ENV
    local ${v_State} = 0

    repeat
        local ${v_Junk} = ${v_Inst}[${v_PC}]
        if not ${v_Junk} then break end

        local ${v_OP} = ${v_Junk}[1]
        local ${v_A}  = ${v_Junk}[2]
        local ${v_B}  = ${v_Junk}[3]
        local ${v_C}  = ${v_Junk}[4]

        if (${v_OP} == ${OP_MAP['LOADK']}) then
            ${v_R}[${v_A}] = ${v_K}[${v_B}]

        elseif (${v_OP} == ${OP_MAP['GETGLOBAL']}) then
            ${v_R}[${v_A}] = ${v_E}[${v_K}[${v_B}]]

        elseif (${v_OP} == ${OP_MAP['SETGLOBAL']}) then
            ${v_E}[${v_K}[${v_B}]] = ${v_R}[${v_A}]

        elseif (${v_OP} == ${OP_MAP['GETTABLE']}) then
            local key = type(${v_C}) == "number" and ${v_K}[${v_C}] or ${v_R}[${v_C}]
            ${v_R}[${v_A}] = ${v_R}[${v_B}][key]

        elseif (${v_OP} == ${OP_MAP['SETTABLE']}) then
            local key = type(${v_B}) == "number" and ${v_K}[${v_B}] or ${v_R}[${v_B}]
            local val = type(${v_C}) == "number" and ${v_K}[${v_C}] or ${v_R}[${v_C}]
            ${v_R}[${v_A}][key] = val

        elseif (${v_OP} == ${OP_MAP['CALL']}) then
            local func = ${v_R}[${v_A}]
            if type(func) == "function" then
                local args = {}
                if ${v_B} > 1 then
                    for i = 1, ${v_B} - 1 do
                        args[#args + 1] = ${v_R}[${v_A} + i]
                    end
                end
                local res = {func(unpack(args))}
                if ${v_C} > 1 then
                    for i = 1, ${v_C} - 1 do
                        ${v_R}[${v_A} + i - 1] = res[i]
                    end
                end
            end

        elseif (${v_OP} == ${OP_MAP['RETURN']}) then
            return
        end

        ${v_PC} = ${v_PC} + 1
    until ${v_PC} > #${v_Inst}
end

${v_VM}(${v_I}, ${v_K})`;
    }
}

module.exports = LuauInterpreterGenerator;
