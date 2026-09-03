// Generador de nombres aleatorios estilo Luraph (2 caracteres)
function randName() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
}

// Obfuscador matemático para números reales
function obfuscateNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    const r1 = Math.floor(Math.random() * 500000) + 100000;
    const r2 = Math.floor(Math.random() * 500000) + 100000;
    const result = num + r1 - r2;
    return `((${result} - ${r1}) + ${r2})`;
}

// Convertidor de Strings a Funciones con Math Unwrapping
function stringToLuraphFunc(str, fnName) {
    if (typeof str !== 'string') return 'nil';
    const buf = Buffer.from(str, 'utf-8');
    const bytes = Array.from(buf);
    
    const varByte = randName();
    const varIdx = randName();
    
    const obfuscatedBytes = bytes.map(b => obfuscateNumber(b)).join(',');
    
    return `(function() local ${varByte}={${obfuscatedBytes}}; local ${varIdx}={}; for i=1,#${varByte} do ${varIdx}[i]=string.char(${varByte}[i]) end; return table.concat(${varIdx}) end)()`;
}

class LuauInterpreterGenerator {
    generateRunner(bytecode) {
        const sourceScript = bytecode.constants && bytecode.constants[1] 
            ? bytecode.constants[1] 
            : 'print("Z-Protector VM")';

        // Mangle variables estilo Luraph/Prometheus
        const v_K = randName();
        const v_I = randName();
        const v_VM = randName();
        const v_PC = randName();
        const v_R = randName();
        const v_E = randName();
        const v_C = randName();
        const v_OP = randName();
        const v_A = randName();
        const v_B = randName();
        const v_C_ = randName();
        const v_State = randName();
        const v_FnS = randName();

        const obfuscatedSource = stringToLuraphFunc(sourceScript, v_FnS);

        // Retorna el código estilo CFF Flattened con condicionales anidados
        return `local ${v_K} = {${obfuscatedSource}}
local ${v_State} = ${obfuscatedNumber(1)}

repeat
    if (${v_State} == 1) then
        local ${v_E} = getfenv and getfenv() or _ENV
        local ${v_R} = ${v_E}["loadstring"] or load or (getgenv and getgenv().loadstring)
        if type(${v_R}) == "function" then
            local ${v_C}, ${v_A} = ${v_R}(${v_K}[1])
            if ${v_C} then
                ${v_C}()
            else
                error(${v_A})
            end
        end
        ${v_State} = 2
    end
until ${v_State} == 2`;
    }
}

module.exports = LuauInterpreterGenerator;
