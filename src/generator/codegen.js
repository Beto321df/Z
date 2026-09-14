const crypto = require('crypto');
const luaparse = require('luaparse');
const { tokenize } = require('../zlang/lexer');
const { ZCompiler } = require('../zlang/compiler');
const { encodeBytecode, ALPHABET } = require('../zlang/codec');

class CodeGenerator {
    randomInt(min, max) {
        return crypto.randomInt(min, max + 1);
    }

    randomName() {
        const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const chars = alphabet + '0123456789';
        let name = alphabet[this.randomInt(0, alphabet.length - 1)];
        for (let i = 1, n = this.randomInt(5, 9); i < n; i += 1) name += chars[this.randomInt(0, chars.length - 1)];
        return name;
    }

    names() {
        return {
            alphabet: this.randomName(), map: this.randomName(), parts: this.randomName(), part: this.randomName(),
            text: this.randomName(), raw: this.randomName(), out: this.randomName(), pc: this.randomName(),
            op: this.randomName(), len: this.randomName(), ch: this.randomName(), i: this.randomName(), j: this.randomName(),
            hi: this.randomName(), lo: this.randomName(), state: this.randomName(), value: this.randomName(),
            loader: this.randomName(), err: this.randomName(), tokenCount: this.randomName(),
            checkA: this.randomName(), checkB: this.randomName(), checkIndex: this.randomName(), expectedSize: this.randomName(),
            expectedHash: this.randomName()
        };
    }

    validateSource(source) {
        try {
            luaparse.parse(source, { wait: false, luaVersion: '5.1' });
        } catch (_) {
            // Luau extends Lua 5.1.
        }
    }

    makeDecoy(n, salt) {
        const a = this.randomInt(1000, 999999);
        const b = this.randomInt(1000, 999999);
        const c = this.randomInt(7, 97);
        const value = (a * c + b + salt) % 1000003;
        return `local ${n.checkA}=${a};local ${n.checkB}=(${value}-${a}+${b})%1000003`;
    }

    lintGenerated(output) {
        try {
            luaparse.parse(output, { wait: false, luaVersion: '5.1' });
        } catch (error) {
            throw new Error(`Z generó un loader inválido: ${error.message}`);
        }
    }

    generate(rawLuaCode) {
        const source = typeof rawLuaCode === 'string' ? rawLuaCode : rawLuaCode && rawLuaCode.source;
        if (typeof source !== 'string' || !source.trim()) throw new Error('El código Lua/Luau está vacío.');
        this.validateSource(source);

        const tokens = tokenize(source);
        const ir = new ZCompiler().compile(tokens);
        const packet = encodeBytecode(ir);
        const n = this.names();

        const parts = packet.z.map(part => {
            let inverse = 1;
            for (let i = 1; i < 256; i += 2) {
                if (((part.m * i) % 256) === 1) {
                    inverse = i;
                    break;
                }
            }
            return `{${part.p},${part.n},\"${part.s}\",${part.x},${part.q},${part.t},${part.a},${part.m},${inverse}}`;
        }).join(',');

        const decoder = [];
        decoder.push(`local ${n.alphabet}=\"${ALPHABET}\"`);
        decoder.push(`local ${n.map}={}`);
        decoder.push(`for ${n.i}=1,#${n.alphabet} do ${n.map}[string.sub(${n.alphabet},${n.i},${n.i})]=${n.i}-1 end`);
        decoder.push(`local ${n.parts}={${parts}}`);
        decoder.push(`table.sort(${n.parts},function(${n.ch},${n.raw})return ${n.ch}[1]<${n.raw}[1] end)`);
        decoder.push(`local ${n.raw}={}`);
        decoder.push(`for _,${n.part} in ipairs(${n.parts}) do`);
        decoder.push(`local ${n.text}={}`);
        decoder.push(`for ${n.i}=1,#${n.part}[3],2 do`);
        decoder.push(`local ${n.hi}=${n.map}[string.sub(${n.part}[3],${n.i},${n.i})];local ${n.lo}=${n.map}[string.sub(${n.part}[3],${n.i}+1,${n.i}+1)]`);
        decoder.push(`local ${n.value}=(${n.hi}*32+${n.lo})%256`);
        decoder.push(`local ${n.j}=(${n.i}-1)/2`);
        decoder.push(`local ${n.state}=(${n.part}[4]+${n.j}*${n.part}[6]+((${n.j}+1)*(${n.j}+${n.part}[5])))%256`);
        decoder.push(`${n.value}=(((${n.value}-${n.part}[7]-${n.state})%256)*${n.part}[9])%256`);
        decoder.push(`${n.text}[#${n.text}+1]=string.char(${n.value})`);
        decoder.push('end');
        decoder.push(`${n.raw}[#${n.raw}+1]=table.concat(${n.text})`);
        decoder.push('end');
        decoder.push(`local ${n.out}=table.concat(${n.raw})`);

        decoder.push(`local ${n.checkA}=61;local ${n.checkB}=167;local ${n.checkIndex}=0`);
        decoder.push(`for ${n.i}=1,#${n.out} do local ${n.value}=string.byte(${n.out},${n.i});${n.checkIndex}=${n.i}-1;${n.checkA}=(${n.checkA}+${n.value}+${n.checkIndex})%256;${n.checkB}=(${n.checkB}+${n.value}+${n.checkA}+${n.checkIndex}*13)%256 end`);
        decoder.push(`local ${n.expectedSize}=${packet.c};local ${n.expectedHash}=(${Math.floor(packet.h / 256)}*256+${packet.h % 256});if #${n.out}~=${n.expectedSize} or (${n.checkA}*256+${n.checkB})~=${n.expectedHash} then error(\"Z payload integrity\") end`);

        decoder.push(`local ${n.pc}=1;local ${n.text}={};local ${n.tokenCount}=0`);
        decoder.push(`while ${n.pc}<=#${n.out} do`);
        decoder.push(`local ${n.op}=string.byte(${n.out},${n.pc});${n.pc}=${n.pc}+1`);
        decoder.push(`if ${n.op}==90 then`);
        decoder.push(`local ${n.raw}=string.byte(${n.out},${n.pc});local ${n.value}=string.byte(${n.out},${n.pc}+1);if ${n.raw}~=2 or ${n.value}~=1 then error(\"Z-IR header\") end;${n.pc}=${n.pc}+2`);
        decoder.push(`elseif ${n.op}==17 then`);
        decoder.push(`local ${n.raw}=string.byte(${n.out},${n.pc});local ${n.len}=string.byte(${n.out},${n.pc}+1)*256+string.byte(${n.out},${n.pc}+2);${n.pc}=${n.pc}+3`);
        decoder.push(`local ${n.ch}=string.sub(${n.out},${n.pc},${n.pc}+${n.len}-1);${n.text}[#${n.text}+1]=${n.ch};${n.pc}=${n.pc}+${n.len};${n.tokenCount}=${n.tokenCount}+1`);
        decoder.push(`elseif ${n.op}==47 then break else error(\"Z-IR opcode\") end`);
        decoder.push('end');
        decoder.push(`if ${n.tokenCount}==0 then error(\"Z-IR vacío\") end`);
        decoder.push(`local ${n.loader},${n.err}=(loadstring or load)(table.concat(${n.text}))`);
        decoder.push(`if not ${n.loader} then error(${n.err}) end`);
        decoder.push(`return ${n.loader}()`);

        const output = `${this.makeDecoy(n, packet.h)};${decoder.join(';')}`;
        this.lintGenerated(output);
        return output;
    }
}

module.exports = CodeGenerator;
