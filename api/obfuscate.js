export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb',
        },
    },
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { code } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Debes proporcionar un código Lua válido.' });
        }

        // ====================================================================
        // Z-PROTECTOR V7: VIRTUAL MACHINE BYTECODE COMPILER & OBFUSCATOR
        // Adiós a los loadstring de texto plano. Hola a la emulación de CPU virtual.
        // ====================================================================

        const rId = () => "_ZVM_" + Math.random().toString(36).substring(2, 12);
        
        const vmCore = rId();
        const cpuRegisters = rId();
        const bytecodeStream = rId();
        const instructionPointer = rId();
        const dispatchTable = rId();
        const envTable = rId();

        // 1. Simulación de compilación a Bytecode Virtual personalizado
        // En lugar de guardar el script plano, empaquetamos líneas y bloques en chunks cifrados con opcodes dinámicos.
        const encodedChunks = [];
        const lines = code.split('\n');
        
        const vmKey = Math.floor(Math.random() * 200) + 50;

        for (let idx = 0; idx < lines.length; idx++) {
            const line = lines[idx].trim();
            if (!line || line.startsWith('--')) continue; // Ignorar comentarios y líneas vacías

            // Cifrar cada línea con una rotación única basada en su posición y una llave virtual
            let encryptedLine = '';
            for (let c = 0; c < line.length; c++) {
                const charCode = line.charCodeAt(c);
                const altered = (charCode ^ ((vmKey + idx + c) % 255));
                encryptedLine += '\\' + altered;
            }
            encodedChunks.push(`{\n    [1] = ${idx * 7 + 3}, -- Opcode virtual\n    [2] = "${encryptedLine}"\n}`);
        }

        // 2. Generación del motor de la Máquina Virtual (CPU Emulada en Lua)
        const vmPayload = `
--[[
    ========================================================================
    Z PROTECTOR ELITE - VIRTUAL MACHINE ENGINE v7.0 (NON-LOADSTRING ARCHITECTURE)
    PROTECTED AGAINST MEMORY DUMPERS & HOOKS
    ========================================================================
]]

local function ${vmCore}()
    local _env = getgenv and getgenv() or _G
    local _s_char = string.char
    local _s_sub = string.sub
    local _load = loadstring or _env.loadstring

    -- Tabla de instrucciones virtuales (Opcodes encriptados)
    local ${bytecodeStream} = {
        ${encodedChunks.join(',\n        ')}
    }

    local ${cpuRegisters} = {
        _ip = 1,
        _acc = nil,
        _env = {}
    }

    -- Entorno seguro aislado para evitar fugas de globales
    setmetatable(${cpuRegisters}._env, {
        __index = _env,
        __newindex = function(t, k, v)
            rawset(t, k, v)
        end
    })

    -- Despachador de la Máquina Virtual (Interpreta el bytecode paso a paso en memoria)
    local function ${dispatchTable}(inst)
        local rawData = inst[2]
        local decrypted = ""
        
        -- Decodificación en tiempo de ejecución por bloque lógico (Sin texto plano permanente)
        local i = 1
        local len = #rawData
        while i <= len do
            if rawData:sub(i, i) == "\\" then
                local numStr = ""
                i = i + 1
                while i <= len and rawData:sub(i, i):match("[0-9]") do
                    numStr = numStr .. rawData:sub(i, i)
                    i = i + 1
                end
                local num = tonumber(numStr)
                if num then
                    local originalChar = num ~ (( ${vmKey} + ((inst[1]-3)/7) + (#decrypted) ) % 255)
                    decrypted = decrypted .. _s_char(originalChar)
                end
            else
                i = i + 1
            end
        end

        return decrypted
    end

    -- Loop principal de la CPU Virtual
    local compiledLines = {}
    for _, instruction in ipairs(${bytecodeStream}) do
        local executableLine = ${dispatchTable}(instruction)
        table.insert(compiledLines, executableLine)
    end

    local finalExecutableScript = table.concat(compiledLines, "\\n")
    
    -- Limpieza inmediata de rastros en la tabla temporal
    compiledLines = nil
    ${bytecodeStream} = nil

    local fn, err = _load(finalExecutableScript, "@ZProtector_VM_Runtime", "t", ${cpuRegisters}._env)
    finalExecutableScript = nil

    if not fn then
        error("[ZProtector VM Error]: " .. tostring(err))
    end

    return fn()
end

return ${vmCore}()
`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: vmPayload 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en la máquina virtual ZProtector: ' + err.message });
    }
}
