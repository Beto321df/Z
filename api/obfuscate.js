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
        // Z-PROTECTOR V9: COMPACT VIRTUAL MACHINE (C-VM ENGINE)
        // Cero 8,000 líneas. Cero texto plano. Bytecode empaquetado en 1 línea.
        // ====================================================================

        const r = () => "_ZVM_" + Math.random().toString(36).substring(2, 8);
        const k1 = Math.floor(Math.random() * 180) + 40;
        const k2 = Math.floor(Math.random() * 150) + 20;

        // Empaquetado de bytes en un flujo virtual optimizado
        const utf8Buffer = Buffer.from(code, 'utf-8');
        let packedStream = '';
        for (let i = 0; i < utf8Buffer.length; i++) {
            const b = utf8Buffer[i];
            const mutated = (b ^ ((k1 + (i * 3)) % 255)) ^ (k2 & 0x0F);
            packedStream += '\\' + mutated;
        }

        const varData = r();
        const varKey1 = r();
        const varKey2 = r();
        const varVm = r();
        const varExec = r();

        // Motor C-VM ultra compacto comprimido estrictamente en una línea
        const compactVMPayload = `local ${varData}="${packedStream}";local ${varKey1}=${k1};local ${varKey2}=${k2};local function ${varVm}()if not game then error()end;local s=""local i=1;local l=#${varData};while i<=l do if ${varData}:sub(i,i)=="\\\\" then local n=""i=i+1;while i<=l and ${varData}:sub(i,i):match("[0-9]") do n=n+${varData}:sub(i,i);i=i+1;end;local val=tonumber(n);if val then local idx=(#s);local orig=(val~(${varKey2}&15))~(${varKey1}+(idx*3))%255;s=s..string.char(orig);end;else i=i+1;end;end;return s;end;local ${varExec}=(getgenv and getgenv().loadstring or loadstring)(${varVm}());return ${varExec}();`;

        return res.status(200).json({ 
            success: true, 
            obfuscatedCode: compactVMPayload 
        });

    } catch (err) {
        return res.status(500).json({ error: 'Error crítico en el motor C-VM: ' + err.message });
    }
}
