const assert = require('assert');
const CodeGenerator = require('../src/generator/stableCodegen.js');
const { buildProgram, OPS } = require('../src/zlang/nativeCompiler3');
const LuauParser = require('../src/parser/luauParser.js');
const Tokenizer = require('../src/lexer/tokenizer.js');
const { encodeProgram } = require('../src/zlang/format3');
const { encodeBytecode, decodeBytecode, ALPHABET, checksum } = require('../src/zlang/codec');
const { executeProgram, multi } = require('../src/zlang/referenceVm');
const { programToIR, validateIR, irToProgram } = require('../src/zlang/ir3');

function assertSymbolOnly(packet) {
    for (const part of packet.z) {
        assert(/^[0-9!@#$%^&*(_+\-=:;<>,.?/|]*$/.test(part.s));
        assert(!/[A-Za-z]/.test(part.s));
        assert(!/\s/.test(part.s));
    }
}

function validateProgram(program) {
    assert.strictEqual(program.version, 3);
    assert.strictEqual(program.parser, 'Z-native-luau');
    assert(program.functions.length >= 1);
    for (const fn of program.functions) {
        assert(Array.isArray(fn.code));
        for (const ins of fn.code) {
            assert(Array.isArray(ins) && ins.length === 5);
            assert(Number.isInteger(ins[0]) && ins[0] >= 1 && ins[0] <= OPS.BREAK);
            for (let i = 1; i < 5; i += 1) assert(Number.isInteger(ins[i]) && ins[i] >= 0);
        }
    }
}

function runReference(source, expected, setup = {}) {
    const program = buildProgram(source);
    validateProgram(program);
    const ir = programToIR(program);
    assert.strictEqual(validateIR(ir), true);
    const roundTrip = irToProgram(ir);
    assert.deepStrictEqual(roundTrip.constants, program.constants);
    assert.deepStrictEqual(roundTrip.functions, program.functions);
    const output = [];
    const globals = {
        print: (...args) => output.push(...args),
        pairs: table => {
            const keys = Object.keys(table);
            let index = 0;
            return multi([(_state, _control) => {
                index += 1;
                const key = keys[index - 1];
                return key === undefined ? multi([]) : multi([key, table[key]]);
            }, null, null]);
        },
        ipairs: table => {
            let index = 0;
            return multi([(_state, _control) => {
                index += 1;
                return index > table.length ? multi([]) : multi([index, table[index]]);
            }, null, 0]);
        },
        ...setup
    };
    executeProgram(roundTrip, globals);
    if (expected) assert.deepStrictEqual(output, expected, source);
    return program;
}

const samples = [
    { source: 'print("Hello from Z3")', expected: ['Hello from Z3'] },
    { source: 'local x = 10 + 20\nprint(x)', expected: [30] },
    { source: 'local t = {a = 1, b = "ok"}\nprint(t.a, t.b)', expected: [1, 'ok'] },
    { source: 'local sum = 0\nfor i = 1, 5 do sum = sum + i end\nprint(sum)', expected: [15] },
    { source: 'local x = 0\nwhile x < 3 do x += 1 end\nprint(x)', expected: [3] },
    { source: 'local function add(a,b) return a+b end\nprint(add(2,3))', expected: [5] },
    { source: 'local function outer() local x=10 return function() return x+5 end end\nlocal f=outer()\nprint(f())', expected: [15] },
    { source: 'for k,v in pairs({a=1,b=2}) do print(k,v) end', expectedCount: 4 },
    { source: 'local game = {GetService=function(self,name) return {Name=name} end}\nprint(game:GetService("Players").Name)', expected: ['Players'] },
    { source: 'local t={};t.value=42\nprint(t.value)', expected: [42] },
    { source: 'local t={};t["value"]=42\nprint(t["value"])', expected: [42] },
    { source: 'local 艾 = 7\nlocal カナ = 艾 * 3\nprint(カナ)', expected: [21] },
    { source: 'local n:number = 4\nprint(n)', expected: [4] },
    { source: 'local text = [[Z\nLuau]]\nprint(text)', expected: ['Z\nLuau'] }
];

for (const sample of samples) {
    const program = runReference(sample.source, sample.expected);
    if (sample.expectedCount) {
        const out = [];
        const globals = {
            print: (...args) => out.push(...args),
            pairs: table => {
                const keys = Object.keys(table);
                let index = 0;
                return multi([(_s, _c) => { index += 1; const key = keys[index - 1]; return key === undefined ? multi([]) : multi([key, table[key]]); }, null, null]);
            }
        };
        executeProgram(program, globals);
        assert.strictEqual(out.length, sample.expectedCount, sample.source);
    }

    const raw = encodeProgram(program);
    assert(raw.length > 16);
    const packet = encodeBytecode(raw);
    assert.strictEqual(packet.a, ALPHABET);
    assertSymbolOnly(packet);
    const decoded = decodeBytecode(packet);
    assert.strictEqual(Buffer.from(decoded).toString('hex'), Buffer.from(raw).toString('hex'));
    assert.strictEqual(checksum(decoded), packet.h);

    const generatedA = new CodeGenerator().generate(sample.source);
    const generatedB = new CodeGenerator().generate(sample.source);
    assert.strictEqual(typeof generatedA, 'string');
    assert(generatedA.length > sample.source.length);
    assert(!/\n/.test(generatedA));
    assert(generatedA.includes('Z3-stable'));
    assert(!generatedA.includes(sample.source));
    assert.notStrictEqual(generatedA, generatedB);
}

const tokenSample = 'local 艾丝 = "ok"; if 艾丝 == "ok" then print(艾丝) end';
const tokens = new Tokenizer(tokenSample).tokenize();
assert(tokens.some(t => t.type === 'IDENTIFIER' && t.value === '艾丝'));
assert.strictEqual(tokens[tokens.length - 1].type, 'EOF');
const ast = new LuauParser(tokenSample).parse();
assert.strictEqual(ast.type, 'Chunk');
assert.strictEqual(ast.body.length, 2);

console.log('Z-native parser + Z-IR + stable Z-Lang 3 stack VM pipeline: OK');
console.log(`Muestras compiladas y ejecutadas en reference VM: ${samples.length}`);
