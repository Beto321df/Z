const crypto = require('crypto');
const luaparse = require('luaparse');
const { buildProgram, OPS, BIN, UNARY } = require('../zlang/compiler3');
const { encodeProgram } = require('../zlang/format3');
const { encodeBytecode, ALPHABET } = require('../zlang/codec');

class CodeGenerator {
    randomInt(min, max) { return crypto.randomInt(min, max + 1); }

    randomName(used) {
        const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const chars = alphabet + '0123456789';
        for (;;) {
            let value = alphabet[this.randomInt(0, alphabet.length - 1)];
            const length = this.randomInt(6, 10);
            for (let i = 1; i < length; i += 1) value += chars[this.randomInt(0, chars.length - 1)];
            if (!used.has(value)) { used.add(value); return value; }
        }
    }

    names() {
        const used = new Set();
        const n = {};
        const fields = [
            'alphabet','map','parts','part','buf','program','pos','u16','u32','read',
            'constants','functions','ctype','size','fn','params','idx','globals',
            'getv','setv','gg','sg','truth','multi','invoke','exec','makeFn','stack','sp',
            'env','varargs','loops','push','pop','ins','op','a','b','c','d','v','key',
            'obj','args','result','left','right','frame','iter','keys','start','finish',
            'step','current','keep','code','def','root','ret','state','control','first','next'
        ];
        for (const field of fields) n[field] = this.randomName(used);
        return n;
    }

    lintGenerated(output) {
        try {
            luaparse.parse(output, { wait: false, comments: false, luaVersion: '5.1' });
        } catch (error) {
            throw new Error(`Z generó un loader inválido: ${error.message}`);
        }
    }

    renderPacketDecoder(packet, n) {
        const parts = packet.z.map(part => {
            let inverse = 1;
            for (let i = 1; i < 256; i += 2) {
                if (((part.m * i) % 256) === 1) { inverse = i; break; }
            }
            return `{${part.p},${part.n},\"${part.s}\",${part.x},${part.q},${part.t},${part.a},${part.m},${inverse}}`;
        }).join(',');

        const code = [];
        code.push(`local ${n.alphabet}=\"${ALPHABET}\"`);
        code.push(`local ${n.map}={}`);
        code.push(`for ${n.idx}=1,#${n.alphabet} do ${n.map}[string.sub(${n.alphabet},${n.idx},${n.idx})]=${n.idx}-1 end`);
        code.push(`local ${n.parts}={${parts}}`);
        code.push(`table.sort(${n.parts},function(${n.a},${n.b})return ${n.a}[1]<${n.b}[1] end)`);
        code.push(`local ${n.buf}={}`);
        code.push(`for _,${n.part} in ipairs(${n.parts}) do`);
        code.push(`local ${n.code}={}`);
        code.push(`for ${n.idx}=1,#${n.part}[3],2 do`);
        code.push(`local ${n.left}=${n.map}[string.sub(${n.part}[3],${n.idx},${n.idx})]`);
        code.push(`local ${n.right}=${n.map}[string.sub(${n.part}[3],${n.idx}+1,${n.idx}+1)]`);
        code.push(`local ${n.v}=(${n.left}*32+${n.right})%256`);
        code.push(`local ${n.state}=(${n.part}[4]+(((${n.idx}-1)/2)*${n.part}[6])+(((${n.idx}-1)/2)+1)*(((${n.idx}-1)/2)+${n.part}[5]))%256`);
        code.push(`${n.v}=(((${n.v}-${n.part}[7]-${n.state})%256)*${n.part}[9])%256`);
        code.push(`${n.code}[#${n.code}+1]=string.char(${n.v})`);
        code.push('end');
        code.push(`${n.buf}[#${n.buf}+1]=table.concat(${n.code})`);
        code.push('end');
        code.push(`local ${n.program}=table.concat(${n.buf})`);
        return code;
    }

    renderVm(program, n) {
        const code = [];
        code.push(`local ${n.u16}=function(${n.program},${n.pos})local ${n.v}=string.byte(${n.program},${n.pos})*256+string.byte(${n.program},${n.pos}+1)return ${n.v},${n.pos}+2 end`);
        code.push(`local ${n.u32}=function(${n.program},${n.pos})local ${n.v}=string.byte(${n.program},${n.pos})*16777216+string.byte(${n.program},${n.pos}+1)*65536+string.byte(${n.program},${n.pos}+2)*256+string.byte(${n.program},${n.pos}+3)return ${n.v},${n.pos}+4 end`);
        code.push(`local ${n.read}=function(${n.program},${n.pos})local ${n.v};${n.v},${n.pos}=${n.u32}(${n.program},${n.pos});local ${n.code}=string.sub(${n.program},${n.pos},${n.pos}+${n.v}-1);return ${n.code},${n.pos}+${n.v} end`);
        code.push(`if string.byte(${n.program},1)~=90 or string.byte(${n.program},2)~=51 or string.byte(${n.program},3)~=1 then error(\"Z3 header\") end`);
        code.push(`local ${n.pos}=5`);
        code.push(`local ${n.constants}={}`);
        code.push(`local ${n.size};${n.size},${n.pos}=${n.u32}(${n.program},${n.pos})`);
        code.push(`for ${n.idx}=1,${n.size} do local ${n.ctype}=string.byte(${n.program},${n.pos});${n.pos}=${n.pos}+1`);
        code.push(`if ${n.ctype}==1 then local ${n.v};${n.v},${n.pos}=${n.read}(${n.program},${n.pos});${n.constants}[${n.idx}]=${n.v}`);
        code.push(`elseif ${n.ctype}==2 then local ${n.v};${n.v},${n.pos}=${n.read}(${n.program},${n.pos});${n.constants}[${n.idx}]=tonumber(${n.v})`);
        code.push(`elseif ${n.ctype}==3 then ${n.constants}[${n.idx}]=string.byte(${n.program},${n.pos})==1;${n.pos}=${n.pos}+1`);
        code.push(`elseif ${n.ctype}==4 then ${n.constants}[${n.idx}]=nil else error(\"Z3 constant\") end end`);

        code.push(`local ${n.functions}={}`);
        code.push(`local ${n.size};${n.size},${n.pos}=${n.u32}(${n.program},${n.pos})`);
        code.push(`for ${n.idx}=1,${n.size} do`);
        code.push(`local ${n.fn}={params={},vararg=false,code={}}`);
        code.push(`local ${n.params};${n.params},${n.pos}=${n.u16}(${n.program},${n.pos})`);
        code.push(`${n.fn}.vararg=string.byte(${n.program},${n.pos})==1;${n.pos}=${n.pos}+1`);
        code.push(`for ${n.a}=1,${n.params} do local ${n.b};${n.b},${n.pos}=${n.u32}(${n.program},${n.pos});${n.fn}.params[${n.a}]=${n.constants}[${n.b}+1] end`);
        code.push(`local ${n.size};${n.size},${n.pos}=${n.u32}(${n.program},${n.pos})`);
        code.push(`for ${n.a}=1,${n.size} do local ${n.op}=string.byte(${n.program},${n.pos});local ${n.b};${n.b},${n.pos}=${n.u32}(${n.program},${n.pos});local ${n.c};${n.c},${n.pos}=${n.u32}(${n.program},${n.pos});local ${n.d};${n.d},${n.pos}=${n.u32}(${n.program},${n.pos});local ${n.v};${n.v},${n.pos}=${n.u32}(${n.program},${n.pos});${n.fn}.code[${n.a}]={${n.op},${n.b},${n.c},${n.d},${n.v}} end`);
        code.push(`${n.functions}[${n.idx}]=${n.fn}`);
        code.push('end');

        code.push(`local ${n.globals}=(type(getgenv)==\"function\" and getgenv()) or _G`);
        code.push(`local ${n.truth}=function(${n.v})return ${n.v}~=nil and ${n.v}~=false end`);
        code.push(`local function ${n.getv}(${n.env},${n.key})local ${n.state}=${n.env};while ${n.state} do local ${n.v}=rawget(${n.state},${n.key});if ${n.v}~=nil then return ${n.v}.v end;${n.state}=rawget(${n.state},\"__p\") end;return nil end`);
        code.push(`local function ${n.setv}(${n.env},${n.key},${n.v})local ${n.state}=${n.env};while ${n.state} do local ${n.frame}=rawget(${n.state},${n.key});if ${n.frame}~=nil then ${n.frame}.v=${n.v};return end;${n.state}=rawget(${n.state},\"__p\") end;rawset(${n.env},${n.key},{v=${n.v}}) end`);
        code.push(`local ${n.gg}=function(${n.key})return ${n.globals}[${n.key}] end`);
        code.push(`local ${n.sg}=function(${n.key},${n.v})${n.globals}[${n.key}]=${n.v} end`);
        code.push(`local ${n.multi}=function(${n.v},${n.a})return{__z=1,n=${n.a},v=${n.v}} end`);
        code.push(`local ${n.invoke}=function(${n.fn},${n.args})if type(${n.fn})~=\"function\" then error(\"Z3 call: not callable\") end;local ${n.ok},${n.packed}=pcall(function()return table.pack(${n.fn}(table.unpack(${n.args},1,#${n.args}))) end);if not ${n.ok} then error(${n.packed}) end;if ${n.packed}.n==1 and type(${n.packed}[1])==\"table\" and ${n.packed}[1].__z==1 then return ${n.packed}[1] end;return ${n.multi}(${n.packed},${n.packed}.n) end`);

        code.push(`local ${n.exec}`);
        code.push(`local function ${n.makeFn}(${n.a},${n.parent})return function(...)local ${n.args}={...};return ${n.exec}(${n.a},${n.parent},${n.args}) end end`);
        code.push(`${n.exec}=function(${n.a},${n.parent},${n.args})`);
        code.push(`local ${n.def}=${n.functions}[${n.a}];local ${n.env}={__p=${n.parent}};local ${n.varargs}={}`);
        code.push(`for ${n.idx}=1,#${n.def}.params do local ${n.key}=${n.def}.params[${n.idx}];rawset(${n.env},${n.key},{v=${n.args}[${n.idx}]}) end`);
        code.push(`if ${n.def}.vararg then for ${n.idx}=#${n.def}.params+1,#${n.args} do ${n.varargs}[#${n.varargs}+1]=${n.args}[${n.idx}] end end`);
        code.push(`local ${n.stack}={};local ${n.sp}=0;local ${n.pc}=1;local ${n.loops}={}`);
        code.push(`local function ${n.push}(${n.v})${n.sp}=${n.sp}+1;${n.stack}[${n.sp}]=${n.v} end`);
        code.push(`local function ${n.pop}()local ${n.v}=${n.stack}[${n.sp}];${n.stack}[${n.sp}]=nil;${n.sp}=${n.sp}-1;return ${n.v} end`);
        code.push(`while ${n.pc}<=#${n.def}.code do local ${n.ins}=${n.def}.code[${n.pc}];${n.op}=${n.ins}[1];${n.a}=${n.ins}[2];${n.b}=${n.ins}[3];${n.c}=${n.ins}[4];${n.d}=${n.ins}[5];${n.pc}=${n.pc}+1`);
        code.push(`if ${n.op}==${OPS.PUSH_CONST} then ${n.push}(${n.constants}[${n.a}+1])`);
        code.push(`elseif ${n.op}==${OPS.LOAD_VAR} then ${n.push}(${n.getv}(${n.env},${n.constants}[${n.a}+1]))`);
        code.push(`elseif ${n.op}==${OPS.STORE_VAR} then ${n.v}=${n.pop}();${n.setv}(${n.env},${n.constants}[${n.a}+1],${n.v})`);
        code.push(`elseif ${n.op}==${OPS.LOAD_GLOBAL} then ${n.push}(${n.gg}(${n.constants}[${n.a}+1]))`);
        code.push(`elseif ${n.op}==${OPS.STORE_GLOBAL} then ${n.v}=${n.pop}();${n.sg}(${n.constants}[${n.a}+1],${n.v})`);
        code.push(`elseif ${n.op}==${OPS.GET_MEMBER} then ${n.obj}=${n.pop}();${n.push}(${n.obj}[${n.constants}[${n.a}+1]])`);
        code.push(`elseif ${n.op}==${OPS.SET_MEMBER} then ${n.v}=${n.pop}();${n.obj}=${n.pop}();${n.obj}[${n.constants}[${n.a}+1]]=${n.v}`);
        code.push(`elseif ${n.op}==${OPS.GET_INDEX} then ${n.key}=${n.pop}();${n.obj}=${n.pop}();${n.push}(${n.obj}[${n.key}])`);
        code.push(`elseif ${n.op}==${OPS.SET_INDEX} then ${n.v}=${n.pop}();${n.key}=${n.pop}();${n.obj}=${n.pop}();${n.obj}[${n.key}]=${n.v}`);
        code.push(`elseif ${n.op}==${OPS.DUP} then ${n.push}(${n.stack}[${n.sp}])`);
        code.push(`elseif ${n.op}==${OPS.POP} then ${n.pop}()`);
        code.push(`elseif ${n.op}==${OPS.UNARY} then ${n.v}=${n.pop}();if ${n.a}==1 then ${n.push}(not ${n.v}) elseif ${n.a}==2 then ${n.push}(-${n.v}) elseif ${n.a}==3 then ${n.push}(#${n.v}) else error(\"Z3 unary\") end`);
        code.push(`elseif ${n.op}==${OPS.BIN} then ${n.right}=${n.pop}();${n.left}=${n.pop}();if ${n.a}==1 then ${n.push}(${n.left}+${n.right}) elseif ${n.a}==2 then ${n.push}(${n.left}-${n.right}) elseif ${n.a}==3 then ${n.push}(${n.left}*${n.right}) elseif ${n.a}==4 then ${n.push}(${n.left}/${n.right}) elseif ${n.a}==5 then ${n.push}(${n.left}%${n.right}) elseif ${n.a}==6 then ${n.push}(${n.left}^${n.right}) elseif ${n.a}==7 then ${n.push}(${n.left}..${n.right}) elseif ${n.a}==8 then ${n.push}(${n.left}==${n.right}) elseif ${n.a}==9 then ${n.push}(${n.left}~=${n.right}) elseif ${n.a}==10 then ${n.push}(${n.left}<${n.right}) elseif ${n.a}==11 then ${n.push}(${n.left}>${n.right}) elseif ${n.a}==12 then ${n.push}(${n.left}<=${n.right}) elseif ${n.a}==13 then ${n.push}(${n.left}>=${n.right}) elseif ${n.a}==14 then ${n.push}(math.floor(${n.left}/${n.right})) else error(\"Z3 binary\") end`);
        code.push(`elseif ${n.op}==${OPS.JUMP} then ${n.pc}=${n.a}`);
        code.push(`elseif ${n.op}==${OPS.JUMP_IF_FALSE} then ${n.v}=${n.pop}();if not ${n.truth}(${n.v}) then ${n.pc}=${n.a} end`);
        code.push(`elseif ${n.op}==${OPS.JUMP_IF_TRUE} then ${n.v}=${n.pop}();if ${n.truth}(${n.v}) then ${n.pc}=${n.a} end`);
        code.push(`elseif ${n.op}==${OPS.MAKE_FUNCTION} then ${n.push}(${n.makeFn}(${n.a},${n.env}))`);
        code.push(`elseif ${n.op}==${OPS.CALL} or ${n.op}==${OPS.CALL_MULTI} then local ${n.args}={};for ${n.idx}=${n.a},1,-1 do ${n.args}[${n.idx}]=${n.pop}() end;local ${n.fn}=${n.pop}();local ${n.result}=${n.invoke}(${n.fn},${n.args});if ${n.op}==${OPS.CALL_MULTI} then ${n.push}(${n.result}) else ${n.push}(${n.result}.v[1]) end`);
        code.push(`elseif ${n.op}==${OPS.CALL_METHOD} or ${n.op}==${OPS.CALL_METHOD_MULTI} then local ${n.args}={};for ${n.idx}=${n.b},1,-1 do ${n.args}[${n.idx}]=${n.pop}() end;local ${n.obj}=${n.pop}();local ${n.fn}=${n.obj}[${n.constants}[${n.a}+1]];local ${n.callArgs}={${n.obj}};for ${n.idx}=1,#${n.args} do ${n.callArgs}[${n.idx}+1]=${n.args}[${n.idx}] end;local ${n.result}=${n.invoke}(${n.fn},${n.callArgs});if ${n.op}==${OPS.CALL_METHOD_MULTI} then ${n.push}(${n.result}) else ${n.push}(${n.result}.v[1]) end`);
        code.push(`elseif ${n.op}==${OPS.RETURN} then ${n.v}=${n.pop}();return ${n.multi}({${n.v}},1)`);
        code.push(`elseif ${n.op}==${OPS.RETURN_MULTI} then local ${n.args}={};for ${n.idx}=${n.a},1,-1 do ${n.args}[${n.idx}]=${n.pop}() end;return ${n.multi}(${n.args},${n.a})`);
        code.push(`elseif ${n.op}==${OPS.GET_VARARG} then ${n.push}(${n.varargs}[1])`);
        code.push(`elseif ${n.op}==${OPS.NEW_TABLE} then ${n.push}({})`);
        code.push(`elseif ${n.op}==${OPS.FOR_NUM_PREP} then local ${n.step}=${n.pop}();local ${n.finish}=${n.pop}();local ${n.start}=${n.pop}();if ${n.step}==0 then error(\"Z3 numeric for step is zero\") end;local ${n.frame}={kind=1,key=${n.constants}[${n.a}+1],current=${n.start},finish=${n.finish},step=${n.step}};${n.loops}[#${n.loops}+1]=${n.frame};local ${n.keep}=(${n.step}>0 and ${n.start}<=${n.finish}) or (${n.step}<0 and ${n.start}>=${n.finish});if not ${n.keep} then ${n.loops}[#${n.loops}]=nil;${n.pc}=${n.d} else ${n.setv}(${n.env},${n.frame}.key,${n.start}) end`);
        code.push(`elseif ${n.op}==${OPS.FOR_NUM_NEXT} then local ${n.frame}=${n.loops}[#${n.loops}];${n.frame}.current=${n.frame}.current+${n.frame}.step;local ${n.keep}=(${n.frame}.step>0 and ${n.frame}.current<=${n.frame}.finish) or (${n.frame}.step<0 and ${n.frame}.current>=${n.frame}.finish);if ${n.keep} then ${n.setv}(${n.env},${n.frame}.key,${n.frame}.current) else ${n.loops}[#${n.loops}]=nil;${n.pc}=${n.d} end`);
        code.push(`elseif ${n.op}==${OPS.ITER_PREP} then local ${n.keys}={};for ${n.idx}=${n.a},1,-1 do ${n.keys}[${n.idx}]=${n.pop}() end;local ${n.result}=${n.pop}();if type(${n.result})~=\"table\" or ${n.result}.__z~=1 or ${n.result}.n<3 then error(\"Z3 iterator setup\") end;local ${n.iter}=${n.result}.v[1];local ${n.state}=${n.result}.v[2];local ${n.control}=${n.result}.v[3];local ${n.first}=${n.invoke}(${n.iter},{${n.state},${n.control}});local ${n.frame}={kind=2,fn=${n.iter},state=${n.state},control=${n.first}.v[1],keys=${n.keys}};${n.loops}[#${n.loops}+1]=${n.frame};if ${n.frame}.control==nil then ${n.loops}[#${n.loops}]=nil;${n.pc}=${n.d} else for ${n.idx}=1,${n.a} do ${n.setv}(${n.env},${n.frame}.keys[${n.idx}],${n.first}.v[${n.idx}]) end end`);
        code.push(`elseif ${n.op}==${OPS.ITER_NEXT} then local ${n.frame}=${n.loops}[#${n.loops}];local ${n.result}=${n.invoke}(${n.frame}.fn,{${n.frame}.state,${n.frame}.control});${n.frame}.control=${n.result}.v[1];if ${n.frame}.control==nil then ${n.loops}[#${n.loops}]=nil;${n.pc}=${n.d} else for ${n.idx}=1,#${n.frame}.keys do ${n.setv}(${n.env},${n.frame}.keys[${n.idx}],${n.result}.v[${n.idx}]) end end`);
        code.push(`elseif ${n.op}==${OPS.BREAK} then ${n.loops}[#${n.loops}]=nil;${n.pc}=${n.a}`);
        code.push(`elseif ${n.op}==${OPS.NOP} then`);
        code.push(`else error(\"Z3 opcode\") end end`);
        code.push(`return ${n.multi}({nil},1)`);
        return code;
    }

    generate(rawLuaCode) {
        const source = typeof rawLuaCode === 'string' ? rawLuaCode : rawLuaCode && rawLuaCode.source;
        if (typeof source !== 'string' || !source.trim()) throw new Error('El código Lua/Luau está vacío.');
        const program = buildProgram(source);
        const bytecode = encodeProgram(program);
        const packet = encodeBytecode(bytecode);
        const n = this.names();
        const output = [...this.renderPacketDecoder(packet, n), ...this.renderVm(program, n), `local ${n.ret}=${n.exec}(${program.root},nil,{})`, `return ${n.ret}.v[1]`].join(' ');
        this.lintGenerated(output);
        return output;
    }
}

module.exports = CodeGenerator;
