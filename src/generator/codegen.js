const luaparse = require('luaparse');
const crypto = require('crypto');

class CodeGenerator {
    randomInt(min, max) {
        return crypto.randomInt(min, max + 1);
    }

    randomName() {
        const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const chars = alphabet + '0123456789';
        let name = alphabet[this.randomInt(0, alphabet.length - 1)];
        for (let i = 1, n = this.randomInt(4, 8); i < n; i++) {
            name += chars[this.randomInt(0, chars.length - 1)];
        }
        return name;
    }

    inverseMod256(value) {
        for (let i = 1; i < 256; i += 2) {
            if (((value * i) & 255) === 1) return i;
        }
        throw new Error('No se pudo crear el multiplicador reversible.');
    }

    transform(bytes, seed, salt) {
        let mul = (this.randomInt(1, 127) * 2) - 1;
        while (mul === 1) mul = (this.randomInt(1, 127) * 2) - 1;
        const inv = this.inverseMod256(mul);
        const add = this.randomInt(0, 255);
        const step = this.randomInt(1, 255);
        const out = new Array(bytes.length);

        for (let i = 0; i < bytes.length; i++) {
            const mix = ((seed + i + 1) * (salt + 3) * step) & 255;
            out[i] = (bytes[i] * mul + add + mix) & 255;
        }

        return { data: out, mul, inv, add, step };
    }

    mode1(bytes) {
        const size = this.randomInt(15, 29);
        const chunks = [];
        for (let p = 0; p < bytes.length; p += size) {
            const part = Array.from(bytes.slice(p, p + size));
            const seed = this.randomInt(0, 255);
            const salt = this.randomInt(1, 255);
            const t = this.transform(part, seed, salt);
            chunks.push({ p, d: t.data, m: t.mul, v: t.inv, a: t.add, s: t.step, x: seed, q: salt });
        }
        this.shuffle(chunks);
        return chunks;
    }

    mode2(bytes) {
        const size = this.randomInt(11, 23);
        const chunks = [];
        for (let p = 0; p < bytes.length; p += size) {
            const part = Array.from(bytes.slice(p, p + size));
            const seed = this.randomInt(0, 255);
            const salt = this.randomInt(1, 255);
            const t = this.transform(part, seed, salt);
            const layer = this.randomInt(1, 255);
            const d = t.data.map((v, i) => (v + seed + layer * (i + 1)) & 255);
            chunks.push({ p, d, m: t.mul, v: t.inv, a: t.add, s: t.step, x: seed, q: salt, z: layer });
        }
        this.shuffle(chunks);
        return chunks;
    }

    mode3(bytes) {
        const size = this.randomInt(9, 19);
        const chunks = [];
        for (let p = 0; p < bytes.length; p += size) {
            const part = Array.from(bytes.slice(p, p + size));
            const seed = this.randomInt(0, 255);
            const salt = this.randomInt(1, 255);
            const t = this.transform(part, seed, salt);
            const reversed = t.data.slice().reverse();
            chunks.push({ p, n: part.length, d: reversed, m: t.mul, v: t.inv, a: t.add, s: t.step, x: seed, q: salt });
        }
        this.shuffle(chunks);
        return chunks;
    }

    mode4(bytes) {
        const size = this.randomInt(7, 15);
        const chunks = [];
        for (let p = 0; p < bytes.length; p += size) {
            const part = Array.from(bytes.slice(p, p + size));
            const seed = this.randomInt(0, 255);
            const salt = this.randomInt(1, 255);
            const t = this.transform(part, seed, salt);
            const even = [];
            const odd = [];
            for (let i = 0; i < t.data.length; i++) {
                (i % 2 === 0 ? even : odd).push(t.data[i]);
            }
            chunks.push({ p, n: part.length, e: even, o: odd, m: t.mul, v: t.inv, a: t.add, s: t.step, x: seed, q: salt });
        }
        this.shuffle(chunks);
        return chunks;
    }

    shuffle(list) {
        for (let i = list.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i);
            [list[i], list[j]] = [list[j], list[i]];
        }
    }

    names() {
        return {
            p: this.randomName(), d: this.randomName(), c: this.randomName(),
            i: this.randomName(), v: this.randomName(), o: this.randomName(),
            x: this.randomName(), q: this.randomName(), r: this.randomName(),
            f: this.randomName(), e: this.randomName(), l: this.randomName(),
            g: this.randomName()
        };
    }

    generate(rawLuaCode) {
        const source = typeof rawLuaCode === 'string' ? rawLuaCode : rawLuaCode.source;
        if (typeof source !== 'string' || !source.trim()) {
            throw new Error('El código Lua/Luau está vacío.');
        }

        try {
            luaparse.parse(source, { wait: false, luaVersion: '5.1' });
        } catch (_) {
            // Luau can contain syntax not understood by luaparse 0.3.1.
        }

        const bytes = Buffer.from(source, 'utf8');
        const mode = this.randomInt(1, 4);
        const n = this.names();
        const loadExpr = '(loadstring or load)';
        let body;

        if (mode === 1) {
            const chunks = this.mode1(bytes).map(c => `{p=${c.p},d={${c.d.join(',')}},m=${c.m},v=${c.v},a=${c.a},s=${c.s},x=${c.x},q=${c.q}}`).join(',');
            body = `local ${n.p}={${chunks}};table.sort(${n.p},function(${n.x},${n.q})return ${n.x}.p<${n.q}.p end);local ${n.o}={};for _,${n.c} in ipairs(${n.p}) do local ${n.d}={};for ${n.i}=1,#${n.c}.d do local ${n.v}=((((${n.c}.d[${n.i}]-${n.c}.a-(((${n.c}.x+${n.i})*(${n.c}.q+3)*${n.c}.s)%256))%256)*${n.c}.v)%256);${n.d}[${n.i}]=string.char(${n.v}) end;${n.o}[#${n.o}+1]=table.concat(${n.d}) end;local ${n.l}=table.concat(${n.o});local ${n.f},${n.g}=${loadExpr}(${n.l});if not ${n.f} then error(${n.g}) end;return ${n.f}()`;
        } else if (mode === 2) {
            const chunks = this.mode2(bytes).map(c => `{p=${c.p},d={${c.d.join(',')}},m=${c.m},v=${c.v},a=${c.a},s=${c.s},x=${c.x},q=${c.q},z=${c.z}}`).join(',');
            body = `local ${n.p}={${chunks}};table.sort(${n.p},function(${n.x},${n.q})return ${n.x}.p<${n.q}.p end);local ${n.o}={};for _,${n.c} in ipairs(${n.p}) do local ${n.d}={};for ${n.i}=1,#${n.c}.d do local ${n.v}=(${n.c}.d[${n.i}]-${n.c}.x-(${n.c}.z*${n.i})-(((${n.c}.x+${n.i})*(${n.c}.q+3)*${n.c}.s)%256))%256;${n.v}=((((${n.v}-${n.c}.a)%256)*${n.c}.v)%256);${n.d}[${n.i}]=string.char(${n.v}) end;${n.o}[#${n.o}+1]=table.concat(${n.d}) end;local ${n.l}=table.concat(${n.o});local ${n.f},${n.g}=${loadExpr}(${n.l});if not ${n.f} then error(${n.g}) end;return ${n.f}()`;
        } else if (mode === 3) {
            const chunks = this.mode3(bytes).map(c => `{p=${c.p},n=${c.n},d={${c.d.join(',')}},m=${c.m},v=${c.v},a=${c.a},s=${c.s},x=${c.x},q=${c.q}}`).join(',');
            body = `local ${n.p}={${chunks}};table.sort(${n.p},function(${n.x},${n.q})return ${n.x}.p<${n.q}.p end);local ${n.o}={};for _,${n.c} in ipairs(${n.p}) do local ${n.d}={};for ${n.i}=1,${n.c}.n do local ${n.v}=((((${n.c}.d[${n.c}.n-${n.i}+1]-${n.c}.a-(((${n.c}.x+${n.i})*(${n.c}.q+3)*${n.c}.s)%256))%256)*${n.c}.v)%256);${n.d}[${n.i}]=string.char(${n.v}) end;${n.o}[#${n.o}+1]=table.concat(${n.d}) end;local ${n.l}=table.concat(${n.o});local ${n.f},${n.g}=${loadExpr}(${n.l});if not ${n.f} then error(${n.g}) end;return ${n.f}()`;
        } else {
            const chunks = this.mode4(bytes).map(c => `{p=${c.p},n=${c.n},e={${c.e.join(',')}},o={${c.o.join(',')}},m=${c.m},v=${c.v},a=${c.a},s=${c.s},x=${c.x},q=${c.q}}`).join(',');
            body = `local ${n.p}={${chunks}};table.sort(${n.p},function(${n.x},${n.q})return ${n.x}.p<${n.q}.p end);local ${n.o}={};for _,${n.c} in ipairs(${n.p}) do local ${n.d}={};local ${n.r}=1;local ${n.e}=1;for ${n.i}=1,${n.c}.n do local ${n.v};if ${n.i}%2==1 then ${n.v}=${n.c}.e[${n.r}];${n.r}=${n.r}+1 else ${n.v}=${n.c}.o[${n.e}];${n.e}=${n.e}+1 end;${n.v}=((((${n.v}-${n.c}.a-(((${n.c}.x+${n.i})*(${n.c}.q+3)*${n.c}.s)%256))%256)*${n.c}.v)%256);${n.d}[${n.i}]=string.char(${n.v}) end;${n.o}[#${n.o}+1]=table.concat(${n.d}) end;local ${n.l}=table.concat(${n.o});local ${n.f},${n.g}=${loadExpr}(${n.l});if not ${n.f} then error(${n.g}) end;return ${n.f}()`;
        }

        return body;
    }
}

module.exports = CodeGenerator;
