const crypto = require('crypto');
const luaparse = require('luaparse');
const { buildProgram, OPS, BIN, UNARY } = require('../zlang/compiler3');
const { encodeProgram } = require('../zlang/format3');
const { encodeBytecode, ALPHABET } = require('../zlang/codec');

class CodeGenerator {
    randomInt(min, max) { return crypto.randomInt(min, max + 1); }

    randomName() {
        const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const chars = alphabet + '0123456789';
        let value = alphabet[this.randomInt(0, alphabet.length - 1)];
        const length = this.randomInt(6, 10);
        for (let i = 1; i < length; i += 1) value += chars[this.randomInt(0, chars.length - 1)];
        return value;
    }

    names() {
        const n = {};
        const fields = [
            'alphabet','map','parts','part','raw','text','out','byte','hi','lo','index','state',
            'program','pos','u16','u32','read','constants','functions','constant','ctype','size',
            'fn','pc','stack','sp','env','parent','globals','value','key','cell','current','params',
            'argList','argc','callArgs','multi','invoke','packed','ok','errorValue','exec','makeFn',
            'op','a','b','c','d','left','right','obj','method','result','truth','frame','loops',
            'iter','keys','varCount','start','finish','step','nextValue','loopKey','code','def',
            'varargs','temp','target','name','i'
        ];
        for (const field of fields) n[field] = this.randomName();
        return n;
    }

    lintGenerated(output) {
        try {
            luaparse.parse(output, { wait: false, luaVersion: '5.1' });
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
        code.push(`for ${n.i}=1,#${n.alphabet} do ${n.map}[string.sub(${n.alphabet},${n.i},${n.i})]=${n.i}-1 end`);
        code.push(`local ${n.parts}={${parts}}`);
        code.push(`table.sort(${n.parts},function(${n.a},${n.b})return ${n.a}[1]<${n.b}[1] end)`);
        code.push(`local ${n.raw}={}`);
        code.push(`for _,${n.part} in ipairs(${n.parts}) do`);
        code.push(`local ${n.text}={}`);
        code.push(`for ${n.i}=1,#${n.part}[3],2 do`);
        code.push(`local ${n.hi}=${n.map}[string.sub(${n.part}[3],${n.i},${n.i})]`);
        code.push(`local ${n.lo}=${n.map}[string.sub(${n.part}[3],${n.i}+1,${n.i}+1)]`);
        code.push(`local ${n.byte}=(${n.hi}*32+${n.lo})%256`);
        code.push(`local ${n.index}=(${n.i}-1)/2`);
        code.push(`local ${n.state}=(${n.part}[4]+${n.index}*${n.part}[6]+((${n.index}+1)*(${n.index}+${n.part}[5])))%256`);
        code.push(`${n.byte}=(((${n.byte}-${n.part}[7]-${n.state})%256)*${n.part}[9])%256`);
        code.push(`${n.text}[#${n.text}+1]=string.char(${n.byte})`);
        code.push('end');
        code.push(`${n.raw}[#${n.raw}+1]=table.concat(${n.text})`);
        code.push('end');
        code.push(`local ${n.program}=table.concat(${n.raw})`);
        return code;
    }

    renderVm(program, n) {
        const code = [];
        code.push(`local ${n.pos}=1`);
        code.push(`local function ${n.u16}(${n.program},${n.pos})local ${n.a}=string.byte(${n.program},${n.pos})*256+string.byte(${n.program},${n.pos}+1)return ${n.a},${n.pos}+2 end`);
        code.push(`local function ${n.u32}(${n.program},${n.pos})local ${n.a}=string.byte(${n.program},${n.pos})*16777216+string.byte(${n.program},${n.pos}+1)*65536+string.byte(${n.program},${n.pos}+2)*256+string.byte(${n.program},${n.pos}+3)return ${n.a},${n.pos}+4 end`);
        code.push(`local function ${n.read}(${n.program},${n.pos})local ${n.size};${n.size},${n.pos}=${n.u32}(${n.program},${n.pos});local ${n.readValue}=string.sub(${n.program},${n.pos},${n.pos}+${n.size}-1);return ${n.readValue},${n.pos}+${n.size} end`);

        code.push(`if string.byte(${n.program},1)~=90 or string.byte(${n.program},2)~=51 or string.byte(${n.program},3)~=1 then error(\"Z3 header\") end`);
        code.push(`local ${n.pos}=5`);
        code.push(`local ${n.constants}={}`);
        code.push(`local ${n.size};${n.size},${n.pos}=${n.u32}(${n.program},${n.pos})`);
        code.push(`for ${n.i}=1,${n.size} do`);
        code.push(`local ${n.ctype}=string.byte(${n.program},${n.pos});${n.pos}=${n.pos}+1`);
        code.push(`if ${n.ctype}==1 then local ${n.a};${n.a},${n.pos}=${n.read}(${n.program},${n.pos});${n.constants}[${n.i}]=${n.a}`);
        code.push(`elseif ${n.ctype}==2 then local ${n.a};${n.a},${n.pos}=${n.read}(${n.program},${n.pos});${n.constants}[${n.i}]=tonumber(${n.a})`);
        code.push(`elseif ${n.ctype}==3 then ${n.constants}[${n.i}]=string.byte(${n.program},${n.pos})==1;${n.pos}=${n.pos}+1`);
        code.push(`elseif ${n.ctype}==4 then ${n.constants}[${n.i}]=nil`);
        code.push(`else error(\"Z3 constant\") end`);
        code.push('end');

        code.push(`local ${n.functions}={}`);
        code.push(`local ${n.size};${n.size},${n.pos}=${n.u32}(${n.program},${n.pos})`);
        code.push(`for ${n.i}=1,${n.size} do`);
        code.push(`local ${n.fn}={params={},vararg=false,code={}};local ${n.params};${n.params},${n.pos}=${n.u16}(${n.program},${n.pos});${n.fn}.vararg=string.byte(${n.program},${n.pos})==1;${n.pos}=${n.pos}+1`);
        code.push(`for ${n.a}=1,${n.params} do local ${n.b};${n.b},${n.pos}=${n.u32}(${n.program},${n.pos});${n.fn}.params[${n.a}]=${n.constants}[${n.b}+1] end`);
        code.push(`local ${n.size};${n.size},${n.pos}=${n.u32}(${n.program},${n.pos})`);
        code.push(`for ${n.a}=1,${n.size} do local ${n.op}=string.byte(${n.program},${n.pos});local ${n.b};${n.b},${n.pos}=${n.u32}(${n.program},${n.pos});local ${n.c};${n.c},${n.pos}=${n.u32}(${n.program},${n.pos});local ${n.d};${n.d},${n.pos}=${n.u32}(${n.program},${n.pos});local ${n.value};${n.value},${n.pos}=${n.u32}(${n.program},${n.pos});${n.fn}.code[${n.a}]={${n.op},${n.b},${n.c},${n.d},${n.value}} end`);
        code.push(`${n.functions}[${n.i}]=${n.fn}`);
        code.push('end');

        code.push(`local ${n.globals}=(type(getgenv)==\"function\" and getgenv()) or _G`);
        code.push(`local ${n.truth}=function(${n.value})return ${n.value}~=nil and ${n.value}~=false end`);
        code.push(`local function ${n.getVar}(${n.env},${n.key})local ${n.parent}=${n.env};while ${n.parent} do local ${n.cell}=rawget(${n.parent},${n.key});if ${n.cell}~=nil then return ${n.cell}.v end;${n.parent}=rawget(${n.parent},\"__p\") end;return nil end`);
        code.push(`local function ${n.setVar}(${n.env},${n.key},${n.value})local ${n.parent}=${n.env};while ${n.parent} do local ${n.cell}=rawget(${n.parent},${n.key});if ${n.cell}~=nil then ${n.cell}.v=${n.value};return end;${n.parent}=rawget(${n.parent},\"__p\") end;rawset(${n.env},${n.key},{v=${n.value}}) end`);
        code.push(`local function ${n.getGlobal}(${n.key})return ${n.globals}[${n.key}] end`);
        code.push(`local function ${n.setGlobal}(${n.key},${n.value})${n.globals}[${n.key}]=${n.value} end`);
        code.push(`local function ${n.multi}(${n.values},${n.a})return{__z=1,n=${n.a},v=${n.values}} end`);
        code.push(`local function ${n.invoke}(${n.fn},${n.argList})if type(${n.fn})~=\"function\" then error(\"Z call: value is not callable\") end;local ${n.ok},${n.packed}=pcall(function()return table.pack(${n.fn}(table.unpack(${n.argList},1,#${n.argList}))) end);if not ${n.ok} then error(${n.packed}) end;if ${n.packed}.n==1 and type(${n.packed}[1])==\"table\" and ${n.packed}[1].__z==1 then return ${n.packed}[1] end;return ${n.multi}(${n.packed},${n.packed}.n) end`);

        code.push(`local ${n.exec}`);
        code.push(`${n.exec}=function(${n.a},${n.parent},${n.argList})`);
        code.push(`local ${n.def}=${n.functions}[${n.a}];local ${n.env}={__p=${n.parent}};local ${n.varargs}={}`);
        code.push(`for ${n.i}=1,#${n.def}.params do local ${n.key}=${n.def}.params[${n.i}];rawset(${n.env},${n.key},{v=${n.argList}[${n.i}]}) end`);
        code.push(`if ${n.def}.vararg then for ${n.i}=#${n.def}.params+1,#${n.argList} do ${n.varargs}[#${n.varargs}+1]=${n.argList}[${n.i}] end end`);
        code.push(`local ${n.stack}={};local ${n.sp}=0;local ${n.pc}=1;local ${n.loops}={}`);
        code.push(`local function ${n.push}(${n.value})${n.sp}=${n.sp}+1;${n.stack}[${n.sp}]=${n.value} end`);
        code.push(`local function ${n.pop}()local ${n.value}=${n.stack}[${n.sp}];${n.stack}[${n.sp}]=nil;${n.sp}=${n.sp}-1;return ${n.value} end`);
        code.push(`while ${n.pc}<=#${n.def}.code do local ${n.ins}=${n.def}.code[${n.pc}];${n.op}=${n.ins}[1];${n.a}=${n.ins}[2];${n.b}=${n.ins}[3];${n.c}=${n.ins}[4];${n.d}=${n.ins}[5];${n.pc}=${n.pc}+1`);
        code.push(`if ${n.op}==${OPS.PUSH_CONST} then ${n.push}(${n.constants}[${n.a}+1])`);
        code.push(`elseif ${n.op}==${OPS.LOAD_VAR} then ${n.push}(${n.getVar}(${n.env},${n.constants}[${n.a}+1]))`);
        code.push(`elseif ${n.op}==${OPS.STORE_VAR} then local ${n.value}=${n.pop}();${n.setVar}(${n.env},${n.constants}[${n.a}+1],${n.value})`);
        code.push(`elseif ${n.op}==${OPS.LOAD_GLOBAL} then ${n.push}(${n.getGlobal}(${n.constants}[${n.a}+1]))`);
        code.push(`elseif ${n.op}==${OPS.STORE_GLOBAL} then local ${n.value}=${n.pop}();${n.setGlobal}(${n.constants}[${n.a}+1],${n.value})`);
        code.push(`elseif ${n.op}==${OPS.GET_MEMBER} then local ${n.obj}=${n.pop}();${n.push}(${n.obj}[${n.constants}[${n.a}+1]])`);
        code.push(`elseif ${n.op}==${OPS.SET_MEMBER} then local ${n.value}=${n.pop}();local ${n.obj}=${n.pop}();${n.obj}[${n.constants}[${n.a}+1]]=${n.value}`);
        code.push(`elseif ${n.op}==${OPS.GET_INDEX} then local ${n.key}=${n.pop}();local ${n.obj}=${n.pop}();${n.push}(${n.obj}[${n.key}])`);
        code.push(`elseif ${n.op}==${OPS.SET_INDEX} then local ${n.value}=${n.pop}();local ${n.key}=${n.pop}();local ${n.obj}=${n.pop}();${n.obj}[${n.key}]=${n.value}`);
        code.push(`elseif ${n.op}==${OPS.DUP} then ${n.push}(${n.stack}[${n.sp}])`);
        code.push(`elseif ${n.op}==${OPS.POP} then ${n.pop}()`);
        code.push(`elseif ${n.op}==${OPS.BIN} then local ${n.right}=${n.pop}();local ${n.left}=${n.pop}();local ${n.result};if ${n.a}==1 then ${n.result}=${n.left}+${n.right} elseif ${n.a}==2 then ${n.result}=${n.left}-${n.right} elseif ${n.a}==3 then ${n.result}=${n.left}*${n.right} elseif ${n.a}==4 then ${n.result}=${n.left}/${n.right} elseif ${n.a}==5 then ${n.result}=${n.left}%${n.right} elseif ${n.a}==6 then ${n.result}=${n.left}^${n.right} elseif ${n.a}==7 then ${n.result}=${n.left}..${n.right} elseif ${n.a}==8 then ${n.result}=(${n.left}==${n.right}) elseif ${n.a}==9 then ${n.result}=(${n.left}~=${n.right}) elseif ${n.a}==10 then ${n.result}=(${n.left}<${n.right}) elseif ${n.a}==11 then ${n.result}=(${n.left}>${n.right}) elseif ${n.a}==12 then ${n.result}=(${n.left}<=${n.right}) elseif ${n.a}==13 then ${n.result}=(${n.left}>=${n.right}) elseif ${n.a}==14 then ${n.result}=math.floor(${n.left}/${n.right}) else error(\"Z binary\") end;${n.push}(${n.result})`);
        code.push(`elseif ${n.op}==${OPS.UNARY} then local ${n.value}=${n.pop}();if ${n.a}==1 then ${n.push}(not ${n.value}) elseif ${n.a}==2 then ${n.push}(-${n.value}) elseif ${n.a}==3 then ${n.push}(#${n.value}) else error(\"Z unary\") end`);
        code.push(`elseif ${n.op}==${OPS.JUMP} then ${n.pc}=${n.a}`);
        code.push(`elseif ${n.op}==${OPS.JUMP_IF_FALSE} then local ${n.value}=${n.pop}();if not ${n.truth}(${n.value}) then ${n.pc}=${n.a} end`);
        code.push(`elseif ${n.op}==${OPS.JUMP_IF_TRUE} then local ${n.value}=${n.pop}();if ${n.truth}(${n.value}) then ${n.pc}=${n.a} end`);
        code.push(`elseif ${n.op}==${OPS.MAKE_FUNCTION} then ${n.push}(${n.makeFn}(${n.a},${n.env}))`);
        code.push(`elseif ${n.op}==${OPS.CALL} or ${n.op}==${OPS.CALL_MULTI} then local ${n.args}={};for ${n.i}=${n.a},1,-1 do ${n.args}[${n.i}] = ${n.pop}() end;local ${n.fn}=${n.pop}();local ${n.multiResult}=${n.invoke}(${n.fn},${n.args});if ${n.op}==${OPS.CALL_MULTI} then ${n.push}(${n.multiResult}) else ${n.push}(${n.multiResult}.v[1]) end`);
        code.push(`elseif ${n.op}==${OPS.CALL_METHOD} or ${n.op}==${OPS.CALL_METHOD_MULTI} then local ${n.args}={};for ${n.i}=${n.a},1,-1 do ${n.args}[${n.i}] = ${n.pop}() end;local ${n.obj}=${n.pop}();local ${n.fn}=${n.obj}[${n.constants}[${n.a}+1]];local ${n.callArgs}={${n.obj}};for ${n.i}=1,#${n.args} do ${n.callArgs}[${n.i}+1]=${n.args}[${n.i}] end;local ${n.multiResult}=${n.invoke}(${n.fn},${n.callArgs});if ${n.op}==${OPS.CALL_METHOD_MULTI} then ${n.push}(${n.multiResult}) else ${n.push}(${n.multiResult}.v[1]) end`);
        code.push(`elseif ${n.op}==${OPS.RETURN} then local ${n.value}=${n.pop}();return ${n.multi}({${n.value}},1)`);
        code.push(`elseif ${n.op}==${OPS.RETURN_MULTI} then local ${n.values}={};for ${n.i}=${n.a},1,-1 do ${n.values}[${n.i}]=${n.pop}() end;return ${n.multi}(${n.values},${n.a})`);
        code.push(`elseif ${n.op}==${OPS.GET_VARARG} then ${n.push}(${n.varargs}[1])`);
        code.push(`elseif ${n.op}==${OPS.NEW_TABLE} then ${n.push}({})`);
        code.push(`elseif ${n.op}==${OPS.FOR_NUM_PREP} then local ${n.step}=${n.pop}();local ${n.finish}=${n.pop}();local ${n.start}=${n.pop}();if ${n.step}==0 then error(\"Z numeric for step is zero\") end;local ${n.frame}={kind=1,key=${n.constants}[${n.a}+1],cur=${n.start},finish=${n.finish},step=${n.step}};${n.loops}[#${n.loops}+1]=${n.frame};local ${n.okLoop}=(${n.step}>0 and ${n.start}<=${n.finish}) or (${n.step}<0 and ${n.start}>={{${n.finish}}}[1]);if not ${n.okLoop} then ${n.loops}[#${n.loops}]=nil;${n.pc}=${n.d} else ${n.setVar}(${n.env},${n.frame}.key,${n.start}) end`);
        code.push(`elseif ${n.op}==${OPS.FOR_NUM_NEXT} then local ${n.frame}=${n.loops}[#${n.loops}];${n.frame}.cur=${n.frame}.cur+${n.frame}.step;local ${n.keep}=(${n.frame}.step>0 and ${n.frame}.cur<=${n.frame}.finish) or (${n.frame}.step<0 and ${n.frame}.cur>=${n.frame}.finish);if ${n.keep} then ${n.setVar}(${n.env},${n.frame}.key,${n.frame}.cur) else ${n.loops}[#${n.loops}]=nil;${n.pc}=${n.d} end`);
        code.push(`elseif ${n.op}==${OPS.ITER_PREP} then local ${n.keys}={};for ${n.i}=${n.a},1,-1 do ${n.keys}[${n.i}]=${n.pop}() end;local ${n.multiValue}=${n.pop}();if type(${n.multiValue})~=\"table\" or ${n.multiValue}.__z~=1 or ${n.multiValue}.n<3 then error(\"Z iterator setup\") end;local ${n.iter}=${n.multiValue}.v[1];local ${n.stateValue}=${n.multiValue}.v[2];local ${n.control}=${n.multiValue}.v[3];local ${n.first}=${n.invoke}(${n.iter},{${n.stateValue},${n.control}});local ${n.frame}={kind=2,fn=${n.iter},state=${n.stateValue},ctrl=${n.first}.v[1],keys=${n.keys}};${n.loops}[#${n.loops}+1]=${n.frame};if ${n.frame}.ctrl==nil then ${n.loops}[#${n.loops}]=nil;${n.pc}=${n.d} else for ${n.i}=1,${n.a} do ${n.setVar}(${n.env},${n.frame}.keys[${n.i}],${n.first}.v[${n.i}]) end end`);
        code.push(`elseif ${n.op}==${OPS.ITER_NEXT} then local ${n.frame}=${n.loops}[#${n.loops}];local ${n.nextMulti}=${n.invoke}(${n.frame}.fn,{${n.frame}.state,${n.frame}.ctrl});${n.frame}.ctrl=${n.nextMulti}.v[1];if ${n.frame}.ctrl==nil then ${n.loops}[#${n.loops}]=nil;${n.pc}=${n.d} else for ${n.i}=1,#${n.frame}.keys do ${n.setVar}(${n.env},${n.frame}.keys[${n.i}],${n.nextMulti}.v[${n.i}]) end end`);
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
        const output = [...this.renderPacketDecoder(packet, n), ...this.renderVm(program, n)].join(' ');
        this.lintGenerated(output);
        return output;
    }
}

module.exports = CodeGenerator;
