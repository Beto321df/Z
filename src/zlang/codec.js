const crypto = require('crypto');

const ALPHABET = '0123456789!@#$%^&*(_+-=:;<,>.?/|';
const BASE = ALPHABET.length;

function randomInt(min, max) {
    return crypto.randomInt(min, max + 1);
}

function inverseMod256(value) {
    for (let i = 1; i < 256; i += 2) {
        if (((value * i) & 255) === 1) return i;
    }
    throw new Error('Z codec no pudo encontrar inverso modular.');
}

function mixByte(value, index, params) {
    const state = (params.seed + index * params.step + ((index + 1) * (index + params.salt))) & 255;
    return (value * params.mul + params.add + state) & 255;
}

function unmixByte(value, index, params) {
    const state = (params.seed + index * params.step + ((index + 1) * (index + params.salt))) & 255;
    return (((value - params.add - state) & 255) * params.inv) & 255;
}

function encodeByte(value) {
    const hi = (value >>> 5) & 31;
    const lo = value & 31;
    return ALPHABET[hi] + ALPHABET[lo];
}

function encode(bytes, params) {
    let out = '';
    for (let i = 0; i < bytes.length; i += 1) {
        out += encodeByte(mixByte(bytes[i], i, params));
    }
    return out;
}

function decode(text, params) {
    if (text.length % 2 !== 0) throw new Error('Z payload corrupto: longitud impar.');
    const out = new Uint8Array(text.length / 2);
    for (let i = 0, p = 0; i < text.length; i += 2, p += 1) {
        const a = ALPHABET.indexOf(text[i]);
        const b = ALPHABET.indexOf(text[i + 1]);
        if (a < 0 || b < 0) throw new Error('Z payload contiene un símbolo inválido.');
        out[p] = unmixByte((a << 5) | b, p, params);
    }
    return out;
}

function makeParams() {
    const mul = (randomInt(1, 127) * 2) - 1;
    const inv = inverseMod256(mul);
    return {
        seed: randomInt(0, 255),
        salt: randomInt(1, 255),
        step: randomInt(1, 255),
        add: randomInt(0, 255),
        mul,
        inv
    };
}

function checksum(bytes) {
    let a = 0x3d;
    let b = 0xa7;
    for (let i = 0; i < bytes.length; i += 1) {
        a = (a + bytes[i] + i) & 255;
        b = (b ^ ((bytes[i] + a + i * 13) & 255)) & 255;
    }
    return ((a << 8) | b) >>> 0;
}

function chunk(input, size) {
    const out = [];
    for (let i = 0; i < input.length; i += size) out.push(input.slice(i, i + size));
    return out;
}

function shuffle(items) {
    for (let i = items.length - 1; i > 0; i -= 1) {
        const j = randomInt(0, i);
        [items[i], items[j]] = [items[j], items[i]];
    }
}

function encodeBytecode(bytecode) {
    const bytes = Buffer.from(bytecode);
    const size = randomInt(32, 72);
    const parts = chunk(bytes, size).map((part, logicalIndex) => {
        const params = makeParams();
        return {
            p: logicalIndex,
            n: part.length,
            s: encode(part, params),
            x: params.seed,
            q: params.salt,
            t: params.step,
            a: params.add,
            m: params.mul
        };
    });

    shuffle(parts);
    return {
        v: 2,
        a: ALPHABET,
        c: bytes.length,
        h: checksum(bytes),
        z: parts
    };
}

function decodeBytecode(packet) {
    if (!packet || packet.v !== 2 || packet.a !== ALPHABET) throw new Error('Z packet version/alphabet inválidos.');
    const parts = [...(packet.z || [])].sort((x, y) => x.p - y.p);
    const result = [];
    for (const part of parts) {
        const params = {
            seed: part.x,
            salt: part.q,
            step: part.t,
            add: part.a,
            mul: part.m,
            inv: inverseMod256(part.m)
        };
        const decoded = decode(part.s, params);
        if (decoded.length !== part.n) throw new Error('Z chunk corrupto.');
        for (const byte of decoded) result.push(byte);
    }
    const out = Uint8Array.from(result);
    if (out.length !== packet.c || checksum(out) !== packet.h) throw new Error('Z checksum inválido.');
    return out;
}

module.exports = {
    ALPHABET,
    encodeBytecode,
    decodeBytecode,
    makeParams,
    checksum
};
