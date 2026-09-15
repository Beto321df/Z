const crypto = require('crypto');
const luaparse = require('luaparse');
const { buildProgram, OPS } = require('../zlang/compiler3');
const { encodeProgram } = require('../zlang/format3');
const { encodeBytecode, ALPHABET } = require('../zlang/codec');

class CodeGenerator {
    randomInt(min, max) { return crypto.randomInt(min, max + 1); }
    randomName(used) {
        const first = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const rest = first + '0123456789';
        for (;;) {
            let out = first[this.randomInt(0, first.length - 1)];
            const length = this.randomInt(6, 10);
            for (let i = 1; i < length; i += 1) out += rest[this.randomInt(0, rest.length - 1)];
            if (!used.has(out)) { used.add(out); return out; }
        }
    }
    names() {
        const used = new Set();
        const fields = ['alphabet','map','parts','part','buf','chunk','program','pos','u16','u32','read','readValue','constants','functions','ctype','size','fn','params','idx','globals','truth','getv','setv','gg','sg','multi','invoke','packed','ok','exec','makeFn','stack','sp','env','varargs','loops','push','pop','ins','op','a','b','c','d','v','key','obj','args','callArgs','result','left','right','frame','iter','keys','start','finish','step','current','keep','code','def','ret','state','control','first','next','parent'];
        const out = {};
        for (const field of fields) out[field] = this.randomName(used);
        return out;
    }
    lintGenerated(output) {
        try { luaparse.parse(output, { wait: false, comments: false, luaVersion: '5.1' }); }
        catch (error) { throw new Error(`Z generó un loader inválido: ${error.message}`); }
    }
    decodeLines(packet, n) {
        const parts = packet.z.map(part => {
            let inv = 1;
            for (let i = 1; i < 256; i += 2) { if ((part.m * i) % 256 === 1) { inv = i; break; } }
            return `{${part.p},${part.n},\"${part.s}\",${part.x},${part.q},${part.t},${part.a},${part.m},${inv}}`;
        }).join(',');
        return [
            `local ${n.alphabet}=\"${ALPHABET}\"`,
            `local ${n.map}={}`,
            `for ${n.idx}=1,#${n.alphabet} do ${n.map}[string.sub(${n.alphabet},${n.idx},${n.idx})]=${n.idx}-1 end`,
            `local ${n.parts}={${parts}}`,
            `table.sort(${n.parts},function(${n.a},${n.b})return ${n.a}[1]<${n.b}[1] end)`,
            `local ${n.buf}={}`,
            `for _,${n.part} in ipairs(${n.parts}) do`,
            `local ${n.chunk}={}`,
            `for ${n.idx}=1,#${n.part}[3],2 do`,
            `local ${n.left}=${n.map}[string.sub(${n.part}[3],${n.idx},${n.idx})]`,
            `local ${n.right}=${n.map}[string.sub(${n.part}[3],${n.idx}+1,${n.idx}+1)]`,
            `local ${n.v}=(${n.left}*32+${n.right})%256`,
            `local ${n.state}=(${n.part}[4]+(((${n.idx}-1)/2)*${n.part}[6])+(((${n.idx}-1)/2+1)*(((${n.idx}-1)/2+${n.part}[5])))%256`,
            `${n.v}=(((${n.v}-${n.part}[7]-${n.state})%256)*${n.part}[9])%256`,
            `${n.chunk}[#${n.chunk}+1]=string.char(${n.v})`,
            'end',
            `${n.buf}[#${n.buf}+1]=table.concat(${n.chunk})`,
            'end',
            `local ${n.program}=table.concat(${n.buf})`
        ];
    }
    vmLines(program, n) {
        return [
            `local ${n.u16}=function(${n.program},${n.pos})local ${n.v}=string.byte(${n.program},${n.pos})*256+string.byte(${n.program},${n.pos}+1)return ${n.v},${n.pos}+2 end`,
            `local ${n.u32}=function(${n.program},${n.pos})local ${n.v}=string.byte(${n.program},${n.pos})*16777216+string.byte(${n.program},${n.pos}+1)*65536+string.byte(${n.program},${n.pos}+2)*256+string.byte(${n.program},${n.pos}+3)return ${n.v},${n.pos}+4 end`,
            `local ${n.read}=function(${n.program},${n.pos})local ${n.v};${n.v},${n.pos}=${n.u32}(${n.program},${n.pos});local ${n.readValue}=string.sub(${n.program},${n.pos},${n.pos}+${n.v}-1);return ${n.readValue},${n.pos}+${n.v} end`,
            `if string.byte(${n.program},1)~=90 or string.byte(${n.program},2)~=51 or string.byte(${n.program},3)~=1 then error(\"Z3 header\") end`,
            `local ${n.pos}=5`,
            `local ${n.constants}={}`,
            `local ${n.size};${n.size},${n.pos}=${n.u32}(${n.program},${n.pos})`,
            `for ${n.idx}=1,${n.size} do local ${n.ctype}=string.byte(${n.program},${n.pos});${n.pos}=${n.pos}+1;if ${n.ctype}==1 then local ${n.v};${n.v},${n.pos}=${n.read}(${n.program},${n.pos});${n.constants}[${n.idx}]=${n.v} elseif ${n.ctype}==2 then local ${n.v};${n.v},${n.pos}=${n.read}(${n.program},${n.pos});${n.constants}[${n.idx}]=tonumber(${n.v}) elseif ${n.ctype}==3 then ${n.constants}[${n.idx}]=string.byte(${n.program},${n.pos})==1;${n.pos}=${n.pos}+1 elseif ${n.ctype}==4 then ${n.constants}[${n.idx}]=nil else error(\"Z3 constant\") end end`,
            `local ${n.functions}={}`,
            `local ${n.size};${n.size},${n.pos}=${n.u32}(${n.program},${n.pos})`,
            `for ${n.idx}=1,${n.size} do local ${n.fn}={params={},vararg=false,code={}};local ${n.params};${n.params},${n.pos}=${n.u16}(${n.program},${n.pos});${n.fn}.vararg=string.byte(${n.program},${n.pos})==1;${n.pos}=${n.pos}+1;for ${n.a}=1,${n.params} do local ${n.b};${n.b},${n.pos}=${n.u32}(${n.program},${n.pos});${n.fn}.params[${n.a}]=${n.constants}[${n.b}+1] end;local ${n.size};${n.size},${n.pos}=${n.u32}(${n.program},${n.pos});for ${n.a}=1,${n.size} do local ${n.op}=string.byte(${n.program},${n.pos});${n.pos}=${n.pos}+1;local ${n.b};${n.b},${n.pos}=${n.u32}(${n.program},${n.pos});local ${n.c};${n.c},${n.pos}=${n.u32}(${n.program},${n.pos});local ${n.d};${n.d},${n.pos}=${n.u32}(${n.program},${n.pos});local ${n.v};${n.v},${n.pos}=${n.u32}(${n.program},${n.pos});${n.fn}.code[${n.a}]={${n.op},${n.b},${n.c},${n.d},${n.v}} end;${n.functions}[${n.idx}]=${n.fn} end`,
            `local ${n.globals}=(type(getgenv)==\"function\" and getgenv()) or _G`,
            `local ${n.truth}=function(${n.v})return ${n.v}~=nil and ${n.v}~=false end`,
            `local ${n.getv}=function(${n.env},${n.key})local ${n.state}=${n.env};while ${n.state} do local ${n.frame}=rawget(${n.state},${n.key});if ${n.frame}~=nil then return ${n.frame}.v end;${n.state}=rawget(${n.state},\"__p\") end;return nil end`,
            `local ${n.setv}=function(${n.env},${n.key},${n.v})local ${n.state}=${n.env};while ${n.state} do local ${n.frame}=rawget(${n.state},${n.key});if ${n.frame}~=nil then ${n.frame}.v=${n.v};return end;${n.state}=rawget(${n.state},\"__p\") end;rawset(${n.env},${n.key},{v=${n.v}}) end`,
            `local ${n.gg}=function(${n.key})return ${n.globals}[${n.key}] end`,
            `local ${n.sg}=function(${n.key},${n.v})${n.globals}[${n.key}]=${n.v} end`,
            `local ${n.multi}=function(${n.v},${n.a})return{__z=1,n=${n.a},v=${n.v}} end`,
            `local ${n.invoke}=function(${n.fn},${n.args})if type(${n.fn})~=\"function\" then error(\"Z3 call: not callable\") end;local ${n.ok},${n.packed}=pcall(function()return table.pack(${n.fn}(table.unpack(${n.args},1,#${n.args}))) end);if not ${n.ok} then error(${n.packed}) end;return ${n.multi}(${n.packed},${n.packed}.n) end`,
            `local ${n.exec}`,
            `local ${n.makeFn}=function(${n.a},${n.parent})return function(...)local ${n.args}={...};return ${n.exec}(${n.a},${n.parent},${n.args}) end end`,
            `${n.exec}=function(${n.a},${n.parent},${n.args})`,
            `local ${n.def}=${n.functions}[${n.a}];local ${n.env}={__p=${n.parent}};local ${n.varargs}={}`,
            `for ${n.idx}=1,#${n.def}.params do local ${n.key}=${n.def}.params[${n.idx}];rawset(${n.env},${n.key},{v=${n.args}[${n.idx}]}) end`,
            `if ${n.def}.vararg then for ${n.idx}=#${n.def}.params+1,#${n.args} do ${n.varargs}[#${n.varargs}+1]=${n.args}[${n.idx}] end end`,
            `local ${n.stack}={};local ${n.sp}=0;local ${n.pc}=1;local ${n.loops}={}`,
            `local function ${n.push}(${n.v})${n.sp}=${n.sp}+1;${n.stack}[${n.sp}]=${n.v} end`,
            `local function ${n.pop}()local ${n.v}=${n.stack}[${n.sp}];${n.stack}[${n.sp}]=nil;${n.sp}=${n.sp}-1;return ${n.v} end`,
            `while ${n.pc}<=#${n.def}.code do local ${n.ins}=${n.def}.code[${n.pc}];${n.op}=${n.ins}[1];${n.a}=${n.ins}[2];${n.b}=${n.ins}[3];${n.c}=${n.ins}[4];${n.d}=${n.ins}[5];${n.pc}=${n.pc}+1`,
            `if ${n.op}==${OPS.PUSH_CONST} then ${n.push}(${n.constants}[${n.a}+1]) elseif ${n.op}==${OPS.LOAD_VAR} then ${n.push}(${n.getv}(${n.env},${n.constants}[${n.a}+1])) elseif ${n.op}==${OPS.STORE_VAR} then ${n.v}=${n.pop}();${n.setv}(${n.env},${n.constants}[${n.a}+1],${n.v}) elseif ${n.op}==${OPS.LOAD_GLOBAL} then ${n.push}(${n.gg}(${n.constants}[${n.a}+1])) elseif ${n.op}==${OPS.STORE_GLOBAL} then ${n.v}=${n.pop}();${n.sg}(${n.constants}[${n.a}+1],${n.v}) elseif ${n.op}==${OPS.GET_MEMBER} then ${n.obj}=${n.pop}();${n.push}(${n.obj}[${n.constants}[${n.a}+1]]) elseif ${n.op}==${OPS.SET_MEMBER} then ${n.v}=${n.pop}();${n.obj}=${n.pop}();${n.obj}[${n.constants}[${n.a}+1]]=${n.v} elseif ${n.op}==${OPS.GET_INDEX} then ${n.key}=${n.pop}();${n.obj}=${n.pop}();${n.push}(${n.obj}[${n.key}]) elseif ${n.op}==${OPS.SET_INDEX} then ${n.v}=${n.pop}();${n.key}=${n.pop}();${n.obj}=${n.pop}();${n.obj}[${n.key}]=${n.v} elseif ${n.op}==${OPS.DUP} then ${n.push}(${n.stack}[${n.sp}]) elseif ${n.op}==${OPS.POP} then ${n.pop}() elseif ${n.op}==${OPS.UNARY} then ${n.v}=${n.pop}();if ${n.a}==1 then ${n.push}(not ${n.v}) elseif ${n.a}==2 then ${n.push}(-${n.v}) elseif ${n.a}==3 then ${n.push}(#${n.v}) else error(\"Z3 unary\") end elseif ${n.op}==${OPS.BIN} then ${n.right}=${n.pop}();${n.left}=${n.pop}();if ${n.a}==1 then ${n.push}(${n.left}+${n.right}) elseif ${n.a}==2 then ${n.push}(${n.left}-${n.right}) elseif ${n.a}==3 then ${n.push}(${n.left}*${n.right}) elseif ${n.a}==4 then ${n.push}(${n.left}/${n.right}) elseif ${n.a}==5 then ${n.push}(${n.left}%${n.right}) elseif ${n.a}==6 then ${n.push}(${n.left}^${n.right}) elseif ${n.a}==7 then ${n.push}(${n.left}..${n.right}) elseif ${n.a}==8 then ${n.push}(${n.left}==${n.right}) elseif ${n.a}==9 then ${n.push}(${n.left}~=${n.right}) elseif ${n.a}==10 then ${n.push}(${n.left}<${n.right}) elseif ${n.a}==11 then ${n.push}(${n.left}>${n.right}) elseif ${n.a}==12 then ${n.push}(${n.left}<=${n.right}) elseif ${n.a}==13 then ${n.push}(${n.left}>=${n.right}) elseif ${n.a}==14 then ${n.push}(math.floor(${n.left}/${n.right})) else error(\"Z3 binary\") end elseif ${n.op}==${OPS.JUMP} then ${n.pc}=${n.a} elseif ${n.op}==${OPS.JUMP_IF_FALSE} then ${n.v}=${n.pop}();if not ${n.truth}(${n.v}) then ${n.pc}=${n.a} end elseif ${n.op}==${OPS.JUMP_IF_TRUE} then ${n.v}=${n.pop}();if ${n.truth}(${n.v}) then ${n.pc}=${n.a} end elseif ${n.op}==${OPS.MAKE_FUNCTION} then ${n.push}(${n.makeFn}(${n.a},${n.env})) elseif ${n.op}==${OPS.CALL} or ${n.op}==${OPS.CALL_MULTI} then local ${n.args}={};for ${n.idx}=${n.a},1,-1 do ${n.args}[${n.idx}]=${n.pop}() end;local ${n.fn}=${n.pop}();local ${n.result}=${n.invoke}(${n.fn},${n.args});if ${n.op}==${OPS.CALL_MULTI} then ${n.push}(${n.result}) else ${n.push}(${n.result}.v[1]) end elseif ${n.op}==${OPS.CALL_METHOD} or ${n.op}==${OPS.CALL_METHOD_MULTI} then local ${n.args}={};for ${n.idx}=${n.b},1,-1 do ${n.args}[${n.idx}]=${n.pop}() end;local ${n.obj}=${n.pop}();local ${n.fn}=${n.obj}[${n.constants}[${n.a}+1]];local ${n.callArgs}={${n.obj}};for ${n.idx}=1,#${n.args} do ${n.callArgs}[${n.idx}+1]=${n.args}[${n.idx}] end;local ${n.result}=${n.invoke}(${n.fn},${n.callArgs});if ${n.op}==${OPS.CALL_METHOD_MULTI} then ${n.push}(${n.result}) else ${n.push}(${n.result}.v[1]) end elseif ${n.op}==${OPS.RETURN} then ${n.v}=${n.pop}();return ${n.multi}({${n.v}},1) elseif ${n.op}==${OPS.RETURN_MULTI} then local ${n.args}={};for ${n.idx}=${n.a},1,-1 do ${n.args}[${n.idx}]=${n.pop}() end;return ${n.multi}(${n.args},${n.a}) elseif ${n.op}==${OPS.GET_VARARG} then ${n.push}(${n.varargs}[1]) elseif ${n.op}==${OPS.NEW_TABLE} then ${n.push}({}) elseif ${n.op}==${OPS.FOR_NUM_PREP} then local ${n.step}=${n.pop}();local ${n.finish}=${n.pop}();local ${n.start}=${n.pop}();if ${n.step}==0 then error(\"Z3 numeric for step is zero\") end;local ${n.frame}={key=${n.constants}[${n.a}+1],current=${n.start},finish=${n.finish},step=${n.step}};local ${n.keep}=(${n.step}>0 and ${n.start}<=${n.finish}) or (${n.step}<0 and ${n.start}>=${n.finish});if not ${n.keep} then ${n.pc}=${n.d} else ${n.loops}[#${n.loops}+1]=${n.frame};${n.setv}(${n.env},${n.frame}.key,${n.start}) end elseif ${n.op}==${OPS.FOR_NUM_NEXT} then local ${n.frame}=${n.loops}[#${n.loops}];${n.frame}.current=${n.frame}.current+${n.frame}.step;local ${n.keep}=(${n.frame}.step>0 and ${n.frame}.current<=${n.frame}.finish) or (${n.frame}.step<0 and ${n.frame}.current>=${n.frame}.finish);if ${n.keep} then ${n.setv}(${n.env},${n.frame}.key,${n.frame}.current) else ${n.loops}[#${n.loops}]=nil;${n.pc}=${n.d} end elseif ${n.op}==${OPS.BREAK} then ${n.loops}[#${n.loops}]=nil;${n.pc}=${n.a} elseif ${n.op}==${OPS.ITER_PREP} then local ${n.keys}={};for ${n.idx}=${n.a},1,-1 do ${n.keys}[${n.idx}]=${n.pop}() end;local ${n.result}=${n.pop}();if type(${n.result})~=\"table\" or ${n.result}.__z~=1 or ${n.result}.n<3 then error(\"Z3 iterator setup\") end;local ${n.iter}=${n.result}.v[1];local ${n.state}=${n.result}.v[2];local ${n.control}=${n.result}.v[3];local ${n.first}=${n.invoke}(${n.iter},{${n.state},${n.control}});local ${n.frame}={fn=${n.iter},state=${n.state},control=${n.first}.v[1],keys=${n.keys}};if ${n.frame}.control==nil then ${n.pc}=${n.d} else ${n.loops}[#${n.loops}+1]=${n.frame};for ${n.idx}=1,#${n.keys} do ${n.setv}(${n.env},${n.frame}.keys[${n.idx}],${n.first}.v[${n.idx}]) end end elseif ${n.op}==${OPS.ITER_NEXT} then local ${n.frame}=${n.loops}[#${n.loops}];local ${n.next}=${n.invoke}(${n.frame}.fn,{${n.frame}.state,${n.frame}.control});${n.frame}.control=${n.next}.v[1];if ${n.frame}.control==nil then ${n.loops}[#${n.loops}]=nil;${n.pc}=${n.d} else for ${n.idx}=1,#${n.frame}.keys do ${n.setv}(${n.env},${n.frame}.keys[${n.idx}],${n.next}.v[${n.idx}]) end;${n.pc}=${n.b} end elseif ${n.op}==${OPS.NOP} then else error(\"Z3 opcode\") end end`,
            'end',
            `return ${n.multi}({nil},1)`
        ];
    }
    generate(source) {
        if (typeof source !== 'string' || !source.trim()) throw new Error('El código Lua/Luau está vacío.');
        const program = buildProgram(source);
        const raw = encodeProgram(program);
        const packet = encodeBytecode(raw);
        const n = this.names();
        const output = [...this.decodeLines(packet, n), ...this.vmLines(program, n)].join(' ').replaceAll('\\"', '"');
        this.lintGenerated(output);
        return output;
    }
}

module.exports = CodeGenerator;