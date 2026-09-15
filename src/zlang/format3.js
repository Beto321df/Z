const MAGIC = [90, 51, 1];
const CONST_STRING = 1;
const CONST_NUMBER = 2;
const CONST_BOOLEAN = 3;
const CONST_NIL = 4;

function pushU16(out, value) {
    out.push((value >>> 8) & 255, value & 255);
}
function pushU32(out, value) {
    out.push((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255);
}
function pushBytes(out, bytes) { for (const byte of bytes) out.push(byte); }

function encodeProgram(program) {
    const out = [...MAGIC, 0];
    pushU32(out, program.constants.length);
    for (const constant of program.constants) {
        out.push(constant.type & 255);
        if (constant.type === CONST_STRING || constant.type === CONST_NUMBER) {
            const bytes = Buffer.from(String(constant.value), 'utf8');
            pushU32(out, bytes.length);
            pushBytes(out, bytes);
        } else if (constant.type === CONST_BOOLEAN) {
            out.push(Number(constant.value) ? 1 : 0);
        } else if (constant.type === CONST_NIL) {
            // Nil has no payload. Keeping the format to a single type byte is
            // important because the emitted Roblox VM advances only past the
            // type tag for nil constants.
        } else {
            throw new Error(`Z constant type inválido: ${constant.type}`);
        }
    }

    pushU32(out, program.functions.length);
    for (const fn of program.functions) {
        pushU16(out, fn.params.length);
        out.push(fn.vararg ? 1 : 0);
        pushU32(out, fn.code.length);
        for (const instruction of fn.code) {
            if (!Array.isArray(instruction) || instruction.length !== 5) throw new Error('Z instruction inválida.');
            out.push(instruction[0] & 255);
            pushU32(out, instruction[1]);
            pushU32(out, instruction[2]);
            pushU32(out, instruction[3]);
            pushU32(out, instruction[4]);
        }
    }
    return Uint8Array.from(out);
}

module.exports = { MAGIC, CONST_STRING, CONST_NUMBER, CONST_BOOLEAN, CONST_NIL, encodeProgram };
