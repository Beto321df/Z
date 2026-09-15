const CodeGenerator = require('../src/generator/codegen.js');
const luaparse = require('luaparse');
const crypto = require('crypto');

const ALPHABET = '0123456789!@#$%^&*(_+-=:;<,>.?/|';

function randomName() {
    return '_' + crypto.randomBytes(6).toString('hex');
}

function fallbackPack(source) {
    const bytes = Buffer.from(source, 'utf8');
    const seed = crypto.randomInt(0, 256);
    const step = crypto.randomInt(1, 256);
    const add = crypto.randomInt(0, 256);
    let payload = '';
    for (let i = 0; i < bytes.length; i += 1) {
        const v = (bytes[i] + seed + i * step + add) & 255;
        payload += ALPHABET[(v >>> 5) & 31] + ALPHABET[v & 31];
    }

    const a = randomName();
    const b = randomName();
    const c = randomName();
    const d = randomName();
    const e = randomName();
    const f = randomName();
    const g = randomName();
    const h = randomName();
    const out = [
        `local ${a}="${ALPHABET}"`,
        `local ${b}={}`,
        `for ${c}=1,#${a} do ${b}[string.sub(${a},${c},${c})]=${c}-1 end`,
        `local ${d}="${payload}"`,
        `local ${e}={}`,
        `for ${c}=1,#${d},2 do`,
        `local ${f}=${b}[string.sub(${d},${c},${c})]`,
        `local ${g}=${b}[string.sub(${d},${c}+1,${c}+1)]`,
        `local ${h}=(${f}*32+${g})%256`,
        `${e}[#${e}+1]=string.char((${h}-${seed}-${c / 2 + 0.5}*${step}-${add})%256)`,
        `end`,
        `local ${f}=table.concat(${e})`,
        `local ${g}=loadstring or load`,
        `if not ${g} then error("Z loader: no se puede ejecutar") end`,
        `local ${h},${a}=${g}(${f})`,
        `if not ${h} then error(${a}) end`,
        `${h}()`
    ];
    const code = out.join(' ');
    luaparse.parse(code, { wait: false, comments: false, luaVersion: '5.1' });
    return code;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const body = req.body || {};
        const sourceScript = body.code || body.script || 'print("Z-Protector Loaded")';
        let obfuscatedCode;
        let mode = 'zlang3';

        try {
            obfuscatedCode = new CodeGenerator().generate(sourceScript);
            obfuscatedCode = String(obfuscatedCode).replaceAll('\\"', '"');
            luaparse.parse(obfuscatedCode, { wait: false, comments: false, luaVersion: '5.1' });
        } catch (_) {
            obfuscatedCode = fallbackPack(sourceScript);
            mode = 'zlang3-compat';
        }

        res.status(200).json({
            success: true,
            engine: 'Z-Lang 3',
            mode,
            format: mode === 'zlang3' ? 'Z-Bytecode / Stack VM' : 'Z-compatible packed loader',
            payloadAlphabet: 'digits-and-symbols-only',
            sourceReconstruction: mode !== 'zlang3',
            directBytecodeExecution: mode === 'zlang3',
            singleLine: true,
            code: obfuscatedCode,
            obfuscatedCode
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
};