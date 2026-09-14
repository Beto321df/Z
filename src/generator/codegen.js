const luaparse = require('luaparse');
const crypto = require('crypto');

class CodeGenerator {
    randomInt(min, max) {
        return crypto.randomInt(min, max + 1);
    }

    randomName() {
        const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let out = alphabet[this.randomInt(0, alphabet.length - 1)];
        const size = this.randomInt(3, 7);
        for (let i = 1; i < size; i++) {
            const chars = alphabet + '0123456789';
            out += chars[this.randomInt(0, chars.length - 1)];
        }
        return out;
    }

    inverseMod256(value) {
        for (let i = 1; i < 256; i += 2) {
            if (((value * i) & 255) === 1) return i;
        }
        throw new Error('No se pudo crear el multiplicador reversible.');
    }

    makeTransform(bytes, seed, salt) {
        let mul = (this.randomInt(1, 127) * 2) - 1;
        while (mul === 1) mul = (this.randomInt(1, 127) * 2) - 1;
        const inv = this.inverseMod256(mul);
        const add = this.randomInt(0, 255);
        const step = this.randomInt(1, 255);
        const out = new Array(bytes.length);

        for (let i = 0; i < bytes.length; i++) {
            const p = (seed + i + 1) * (salt + 3);
            out[i] = (bytes[i] * mul + add + (p * step)) & 255;
        }

        return { data: out, mul, inv, add, step };
    }

    encodeMode1(bytes) {
        const chunkSize = this.randomInt(17, 31);
        const chunks = [];

        for (let start = 0; start < bytes.length; start += chunkSize) {
            const part = Array.from(bytes.slice(start, start + chunkSize));
            const t = this.makeTransform(part, start, 1);
            chunks.push({ p: start, d: t.data, m: t.mul, v: t.inv, a: t.add, s: t.step });
        }

        // Shuffle the physical order. The original position is kept as metadata.
        for (let i = chunks.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i);
            [chunks[i], chunks[j]] = [chunks[j], chunks[i]];
        }

        return { chunks };
    }

    encodeMode2(bytes) {
        const chunkSize = this.randomInt(13, 25);
        const chunks = [];
        let serial = this.randomInt(11, 239);

        for (let start = 0; start < bytes.length; start += chunkSize) {
            const part = Array.from(bytes.slice(start, start + chunkSize));
            const t = this.makeTransform(part, serial, 7);
            serial = (serial * 17 + start + 31) & 255;
            const salt = this.randomInt(1, 255);
            const data = t.data.map((v, i) => (v + ((i + 1) * salt) + serial) & 255);
            chunks.push({ p: start, d: data, m: t.mul, v: t.inv, a: t.add, s: t.step, q: salt, r: serial });
        }

        // A second permutation makes the data layout different from mode 1.
        for (let i = chunks.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i);
            [chunks[i], chunks[j]] = [chunks[j], chunks[i]];
        }

        return { chunks };
    }

    encodeMode3(bytes) {
        // Delta form + reversible affine transform. This is intentionally different
        // from the direct byte encoding used by the other modes.
        const delta = new Array(bytes.length);
        let previous = this.randomInt(0, 255);
        const seed = previous;

        for (let i = 0; i < bytes.length; i++) {
            delta[i] = (bytes[i] - previous) & 255;
            previous = bytes[i];
        }

        const t = this.makeTransform(delta, seed, 13);
        const block = this.randomInt(9, 19);
        const blocks = [];

        for (let start = 0; start < t.data.length; start += block) {
            blocks.push({
                p: start,
                d: t.data.slice(start, start + block)
            });
        }

        for (let i = blocks.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i);
            [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
        }

        return {
            blocks,
            seed,
            mul: t.mul,
            inv: t.inv,
            add: t.add,
            step: t.step
        };
    }

    encodeMode4(bytes) {
        // Fragmented two-layer representation. The payload is split into small
        // fragments, each with its own affine parameters and local salt.
        const fragments = [];
        const chunkSize = this.randomInt(7, 15);

        for (let start = 0; start < bytes.length; start += chunkSize) {
            const part = Array.from(bytes.slice(start, start + chunkSize));
            const seed = this.randomInt(1, 255);
            const t = this.makeTransform(part, seed, 23);
            const mask = this.randomInt(1, 255);
            const data = t.data.map((v, i) => (v + seed + mask * (i + 1)) & 255);
            fragments.push({
                p: start,
                d: data,
                m: t.mul,
                v: t.inv,
                a: t.add,
                s: t.step,
                x: seed,
                z: mask
            });
        }

        for (let i = fragments.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i);
            [fragments[i], fragments[j]] = [fragments[j], fragments[i]];
        }

        return { fragments };
    }

    generate(rawLuaCode) {
        const source = typeof rawLuaCode === 'string' ? rawLuaCode : rawLuaCode.source;
        if (typeof source !== 'string' || !source.trim()) {
            throw new Error('El código Lua/Luau está vacío.');
        }

        // luaparse is only a compatibility check. Luau syntax that luaparse 0.3.1
        // does not understand is allowed to continue to the Roblox runtime.
        try {
            luaparse.parse(source, { wait: false, luaVersion: '5.1' });
        } catch (_) {
            // Intentionally ignored for Luau compatibility.
        }

        const bytes = Buffer.from(source, 'utf8');
        const mode = this.randomInt(1, 4);

        const n = {
            loader: this.randomName(),
            payload: this.randomName(),
            item: this.randomName(),
            out: this.randomName(),
            decode: this.randomName(),
            run: this.randomName(),
            lib: this.randomName(),
            tmp: this.randomName(),
            idx: this.randomName(),
            value: this.randomName(),
            state: this.randomName(),
            fake: this.randomName()
        };

        const loadExpr = `(loadstring or load)`;
        const fakeSeed = this.randomInt(1000, 900000);

        let body;

        if (mode === 1) {
            const packed = this.encodeMode1(bytes);
            const chunks = packed.chunks.map(c => `{p=${c.p},d={${c.d.join(',')}},m=${c.m},v=${c.v},a=${c.a},s=${c.s}}`).join(',');
            body = `local ${n.payload}={${chunks}};table.sort(${n.payload},function(${n.item},${n.tmp})return ${n.item}.p<${n.tmp}.p end);local ${n.out}={};for _,${n.item} in ipairs(${n.payload}) do local ${n.state}={};for ${n.idx}=1,${n.item}.d and #${n.item}.d do local ${n.value}=((((${n.item}.d[${n.idx}]-${n.item}.a-(((${n.item}.p+${n.idx})*4)*${n.item}.s))%256)*${n.item}.v)%256);${n.state}[${n.idx}]=string.char(${n.value}) end;${n.out}[#${n.out}+1]=table.concat(${n.state}) end;local ${n.loader}=table.concat(${n.out});local ${n.run},${n.fake}=${loadExpr}(${n.loader});if not ${n.run} then error(${n.fake}) end;return ${n.run}()`;
        } else if (mode === 2) {
            const packed = this.encodeMode2(bytes);
            const chunks = packed.chunks.map(c => `{p=${c.p},d={${c.d.join(',')}},m=${c.m},v=${c.v},a=${c.a},s=${c.s},q=${c.q},r=${c.r}}`).join(',');
            body = `local ${n.payload}={${chunks}};table.sort(${n.payload},function(${n.item},${n.tmp})return ${n.item}.p<${n.tmp}.p end);local ${n.out}={};for _,${n.item} in ipairs(${n.payload}) do local ${n.state}={};for ${n.idx}=1,#${n.item}.d do local ${n.value}=(${n.item}.d[${n.idx}]-(((${n.idx})*${n.item}.q)+${n.item}.r))%256;${n.value}=((((${n.value}-${n.item}.a-(((${n.item}.p+${n.idx})*10)*${n.item}.s))%256)*${n.item}.v)%256);${n.state}[${n.idx}]=string.char(${n.value}) end;${n.out}[#${n.out}+1]=table.concat(${n.state}) end;local ${n.loader}=table.concat(${n.out});local ${n.run},${n.fake}=${loadExpr}(${n.loader});if not ${n.run} then error(${n.fake}) end;return ${n.run}()`;
        } else if (mode === 3) {
            const packed = this.encodeMode3(bytes);
            const blocks = packed.blocks.map(b => `{p=${b.p},d={${b.d.join(',')}}}`).join(',');
            body = `local ${n.payload}={${blocks}};table.sort(${n.payload},function(${n.item},${n.tmp})return ${n.item}.p<${n.tmp}.p end);local ${n.out}={};local ${n.state}=${packed.seed};local ${n.fake}={};for _,${n.item} in ipairs(${n.payload}) do for ${n.idx}=1,#${n.item}.d do local ${n.value}=(${n.item}.d[${n.idx}]-${packed.add}-(((${n.item}.p+${n.idx})*(${packed.seed}+3))*${packed.step}))%256;${n.value}=(((${n.value}*${packed.inv})%256));${n.state}=(${n.state}+${n.value})%256;${n.out}[#${n.out}+1]=string.char(${n.state}) end end;local ${n.loader}=table.concat(${n.out});local ${n.run},${n.fake}=${loadExpr}(${n.loader});if not ${n.run} then error(${n.fake}) end;return ${n.run}()`;
        } else {
            const packed = this.encodeMode4(bytes);
            const fragments = packed.fragments.map(c => `{p=${c.p},d={${c.d.join(',')}},m=${c.m},v=${c.v},a=${c.a},s=${c.s},x=${c.x},z=${c.z}}`).join(',');
            body = `local ${n.payload}={${fragments}};table.sort(${n.payload},function(${n.item},${n.tmp})return ${n.item}.p<${n.tmp}.p end);local ${n.out}={};for _,${n.item} in ipairs(${n.payload}) do local ${n.state}={};for ${n.idx}=1,#${n.item}.d do local ${n.value}=(${n.item}.d[${n.idx}-${n.item}.p+${n.item}.p] or ${n.item}.d[${n.idx}]);${n.value}=(${n.item}.d[${n.idx}]-${n.item}.x-(${n.item}.z*${n.idx}))%256;${n.value}=(${n.value}-${n.item}.a-(((${n.item}.p+${n.idx})*26)*${n.item}.s))%256;${n.value}=(((${n.value}*${n.item}.v)%256));${n.state}[${n.idx}]=string.char(${n.value}) end;${n.out}[#${n.out}+1]=table.concat(${n.state}) end;local ${n.loader}=table.concat(${n.out});local ${n.run},${n.fake}=${loadExpr}(${n.loader});if not ${n.run} then error(${n.fake}) end;return ${n.run}()`;
        }

        // Small runtime decoy. It is deterministic and side-effect free.
        const decoy = `local ${n.lib}=${fakeSeed};local ${n.fake}=(${n.lib}%17==0);if ${n.fake} then ${n.lib}=(${n.lib}+31)%999983 end;`;
        return `${decoy}${body}`;
    }
}

module.exports = CodeGenerator;
