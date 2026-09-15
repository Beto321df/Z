const crypto = require('crypto');
const BaseCodeGenerator = require('./codegen.js');
const { decodeBytecode } = require('../zlang/codec');
const { OPS } = require('../zlang/nativeCompiler3');

// Runtime-stability layer for the existing Z-Lang 3 generator.
// It keeps the existing compiler/bytecode/VM, but replaces the fragile
// symbol-map decoder with a numeric chunk decoder so malformed characters
// can never turn into nil arithmetic during bytecode reconstruction.
class StableCodeGenerator extends BaseCodeGenerator {
    decodeLines(packet, n) {
        const raw = Buffer.from(decodeBytecode(packet));
        const chunkSize = 48;
        const chunks = [];
        let offset = 0;
        let logical = 0;

        while (offset < raw.length) {
            const end = Math.min(offset + chunkSize, raw.length);
            const shift = crypto.randomInt(1, 256);
            const values = [];
            for (let i = offset; i < end; i += 1) {
                values.push((raw[i] + shift) & 255);
            }
            chunks.push({ p: logical++, s: shift, b: values });
            offset = end;
        }

        // Shuffle physical chunks while retaining their logical position.
        for (let i = chunks.length - 1; i > 0; i -= 1) {
            const j = crypto.randomInt(0, i + 1);
            [chunks[i], chunks[j]] = [chunks[j], chunks[i]];
        }

        const encoded = chunks.map(part => `{${part.p},${part.s},{${part.b.join(',')}}}`).join(',');
        return [
            `local ${n.parts}={${encoded}}`,
            `table.sort(${n.parts},function(${n.a},${n.b})return ${n.a}[1]<${n.b}[1] end)`,
            `local ${n.buf}={}`,
            `for _,${n.part} in ipairs(${n.parts}) do local ${n.chunk}=${n.part}[3];local ${n.state}={};for ${n.idx}=1,#${n.chunk} do ${n.state}[${n.idx}]=string.char((${n.chunk}[${n.idx}]-${n.part}[2])%256) end;${n.buf}[#${n.buf}+1]=table.concat(${n.state}) end`,
            `local ${n.program}=table.concat(${n.buf})`,
            `local ${n.keep}=\"Z3-stable\"`
        ];
    }
    vmLines(program, n) {
        const lines = super.vmLines(program, n).slice();
        const dispatchIndex = lines.findIndex(line => line.startsWith(`if ${n.op}==${OPS.PUSH_CONST}`));
        if (dispatchIndex < 0) throw new Error('Z stable VM dispatch no encontrado.');

        const marker = ` elseif ${n.op}==${OPS.RETURN} then`;
        const multiCases =
            ` elseif ${n.op}==${OPS.UNPACK_MULTI} then ` +
            `local ${n.result}=${n.pop}();if type(${n.result})~=\"table\" or ${n.result}.__z~=1 then error(\"Z3 multi invalido\") end;` +
            `for ${n.idx}=1,${n.a} do ${n.push}(${n.result}.v[${n.idx}]) end` +
            ` elseif ${n.op}==${OPS.RETURN_TOP_MULTI} then ` +
            `local ${n.result}=${n.pop}();if type(${n.result})~=\"table\" or ${n.result}.__z~=1 then error(\"Z3 multi return invalido\") end;return ${n.result}`;

        lines[dispatchIndex] = lines[dispatchIndex].replace(marker, multiCases + marker);
        return lines;
    }
}

module.exports = StableCodeGenerator;