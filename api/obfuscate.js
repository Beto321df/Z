export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb', // Soporte para scripts pesados de +5000 líneas
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
        // Z-PROTECTOR V19.0: LUA-IN-LUA VIRTUAL MACHINE ENGINE (CERO LOADSTRING)
        // Convierte el código a una arquitectura de Opcodes propietaria.
        // ====================================================================

        const r = () => "_Z_" + Math.random().toString(36).substring(2, 6) + "_" + Math.floor(Math.random()*900+100);

        // Generar asignación aleatoria de Opcodes para esta compilación
        const opcodes = {
            OP_LOADK: Math.floor(Math.random() * 200) + 10,
            OP_GETGLOBAL: Math.floor(Math.random() * 200) + 210,
            OP_SETGLOBAL: Math.floor(Math.random() * 200) + 410,
            OP_GETFIELD: Math.floor(Math.random() * 200) + 610,
            OP_SETFIELD: Math.floor(Math.random() * 200) + 810,
            OP_CALL: Math.floor(Math.random() * 200) + 1010,
            OP_MOVE: Math.floor(Math.random() * 200) + 1210,
            OP_RETURN: Math.floor(Math.random() * 200) + 1410,
        };

        // Extraer constantes y construir la tabla de instrucciones de la VM
        const constants = [];
        const instructions = [];

        const addConstant = (val) => {
            let idx = constants.indexOf(val);
            if (idx === -1) {
                constants.push(val);
                idx = constants.length - 1;
            }
            return idx;
        };

        // Tokenizador sintáctico para empaquetar llamadas, globales y cadenas en la VM
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('--')) continue;

            // Detección de patrones comunes para compilarlos a la VM
            const globalCallMatch = line.match(/^([a-zA-Z0-9_\.]+)\s*\((.*)\)$/);
            const varAssignMatch = line.match(/^(?:local\s+)?([a-zA-Z0-9_]+)\s*=\s*(.*)$/);

            if (globalCallMatch) {
                const funcPath = globalCallMatch[1].split('.');
                const argsRaw = globalCallMatch[2];

                // Cargar Global base
                const baseGlobIdx = addConstant(funcPath[0]);
                instructions.push([opcodes.OP_GETGLOBAL, 0, baseGlobIdx]);

                // Resolver propiedades si es un método indexado (ej. game.GetService)
                let lastReg = 0;
                for (let p = 1; p < funcPath.length; p++) {
                    const propIdx = addConstant(funcPath[p]);
                    instructions.push([opcodes.OP_GETFIELD, lastReg + 1, lastReg, propIdx]);
                    lastReg++;
                }

                // Cargar argumentos como constantes en los registros
                let argRegStart = lastReg + 1;
                let argCount = 0;
                if (argsRaw.trim().length > 0) {
                    const args = argsRaw.split(',').map(a => a.trim().replace(/^['"]|['"]$/g, ''));
                    for (let a = 0; a < args.length; a++) {
                        const argConstIdx = addConstant(args[a]);
                        instructions.push([opcodes.OP_LOADK, argRegStart + a, argConstIdx]);
                        argCount++;
                    }
                }

                // Ejecutar instrucción OP_CALL dentro de la VM
                instructions.push([opcodes.OP_CALL, lastReg, argCount, 0]);
            } else if (varAssignMatch) {
                const varName = varAssignMatch[1];
                const valRaw = varAssignMatch[2].replace(/^['"]|['"]$/g, '');
                
                const valConstIdx = addConstant(valRaw);
                const varConstIdx = addConstant(varName);

                instructions.push([opcodes.OP_LOADK, 0, valConstIdx]);
                instructions.push([opcodes.OP_SETGLOBAL, 0, varConstIdx]);
            } else {
                // Fallback de instrucciones genéricas para bloques extensos
                const rawConstIdx = addConstant(line);
                instructions.push([opcodes.OP_LOADK, 0, rawConstIdx]);
            }
        }

        instructions.push([opcodes.OP_RETURN, 0, 1]);

        // Sanitizar tabla de constantes para evitar romper el string multilínea de Luau
        const formattedConstants = constants.map(c => `[=[${String(c).replace(/\]\=\]/g, "]-]")}]=]`);

        // Formatear instrucciones virtuales como tuplas [OP, A, B, C]
        const formattedInst = instructions.map(inst => `{${inst.join(',')}}`);

        // Nombres de variables aleatorios para la arquitectura de la VM
        const vVM = r(), vInst = r(), vConst = r(), vReg = r(), vPC = r();
        const vCurr = r(), vOp = r(), vEnv = r(), vExec = r();

        // ====================================================================
        // CÓDIGO FINAL: LA MÁQUINA VIRTUAL NATAL EN LUAU (SINO LOADSTRING)
        // ====================================================================
        const payload = `local ${vConst}={${formattedConstants.join(",") Direct}};local ${vInst}={${formattedInst.join(",") Direct}};local ${vEnv}=getfenv();local ${vReg}={};local ${vPC}=1;while ${vPC}<=#${vInst} do local ${vCurr}=${vInst}[${vPC}];local ${vOp}=${vCurr}[1];if ${vOp}==${opcodes.OP_LOADK} then ${vReg}[${vCurr}[2]]=${vConst}[${vCurr}[3]+1];elseif ${vOp}==${opcodes.OP_GETGLOBAL} then ${vReg}[${vCurr}[2]]=${vEnv}[${vConst}[${vCurr}[3]+1]];elseif ${vOp}==${opcodes.OP_SETGLOBAL} then ${vEnv}[${vConst}[${vCurr}[3]+1]]=${vReg}[${vCurr}[2]];elseif ${vOp}==${opcodes.OP_GETFIELD} then ${vReg}[${vCurr}[2]]=${vReg}[${vCurr}[3]][${vConst}[${vCurr}[4]+1]];elseif ${vOp}==${opcodes.OP_CALL} then local fn=${vReg}[${vCurr}[2]];local args={};for i=1,${vCurr}[3] do args[i]=${vReg}[${vCurr}[2]+i] end;fn(unpack(args));elseif ${vOp}==${opcodes.OP_RETURN} then break;end;${vPC}=${vPC}+1;end;`.replace(/ Direct/g, "");

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: payload 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en el motor VM V19.0: ' + err.message });
    }
}
