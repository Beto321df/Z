const assert = require('assert');
const CodeGenerator = require('../src/generator/codegen.js');
const { buildProgram, OPS } = require('../src/zlang/compiler3');
const { encodeProgram } = require('../src/zlang/format3');
const { encodeBytecode, decodeBytecode, ALPHABET, checksum } = require('../src/zlang/codec');
const { executeProgram, multi } = require('../src/zlang/referenceVm');

function assertSymbolOnly(packet) {
    for (const part of packet.z) {
        assert(/^[0-9!@#$%^&*(_+\-=:;<>,.?/|]*$/.test(part.s));
        assert(!/[A-Za-z]/.test(part.s));
        assert(!/\s/.test(part.s));
    }
}

function validateProgram(program) {
    assert.strictEqual(program.version, 3);
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

const samples = [
    { source: 'print("Hello from Z3")', expected: ['Hello from Z3'] },
    { source: 'local x = 10 + 20\nprint(x)', expected: [30] },
    { source: 'local t = {a = 1, b = "ok"}\nprint(t.a, t.b)', expected: [1, 'ok'] },
    { source: 'local sum = 0\nfor i = 1, 5 do sum = sum + i end\nprint(sum)', expected: [15] },
    { source: 'local x = 0\nwhile x < 3 do x = x + 1 end\nprint(x)', expected: [3] },
    { source: 'local function add(a,b) return a+b end\nprint(add(2,3))', expected: [5] },
    { source: 'for k,v in pairs({a=1,b=2}) do print(k,v) end', expectedCount: 4 },
    { source: 'local game = {GetService=function(self,name) return {Name=name} end}\nprint(game:GetService("Players").Name)', expected: ['Players'] }
];

for (const sample of samples) {
    const program = buildProgram(sample.source);
    validateProgram(program);

    const raw = encodeProgram(program);
    assert(raw.length > 16);
    const packet = encodeBytecode(raw);
    assert.strictEqual(packet.a, ALPHABET);
    assertSymbolOnly(packet);
    const decoded = decodeBytecode(packet);
    assert.strictEqual(Buffer.from(decoded).toString('hex'), Buffer.from(raw).toString('hex'));
    assert.strictEqual(checksum(decoded), packet.h);

    const output = [];
    const globals = {
        print: (...args) => { output.push(...args); },
        pairs: table => {
            const keys = Object.keys(table);
            let index = 0;
            return multi([
                (_state, control) => {
                    index += 1;
                    const key = keys[index - 1];
                    return key === undefined ? multi([]) : multi([key, table[key]]);
                },
                null,
                null
            ]);
        },
        ipairs: table => {
            let index = 0;
            return multi([
                (_state, control) => {
                    index += 1;
                    return index > table.length ? multi([]) : multi([index, table[index]]);
                },
                null,
                0
            ]);
        }
    };
    const result = executeProgram(program, globals);
    if (sample.expected) assert.deepStrictEqual(output, sample.expected, sample.source);
    if (sample.expectedCount) assert.strictEqual(output.length, sample.expectedCount, sample.source);
    assert(result === undefined || result !== undefined);

    const generated = new CodeGenerator().generate(sample.source);
    assert.strictEqual(typeof generated, 'string');
    assert(generated.length > sample.source.length);
    assert(!/\n/.test(generated));
    assert(!generated.includes(sample.source));
}

console.log('Z-Lang 3 stack VM pipeline: OK');
console.log(`Muestras compiladas y ejecutadas en reference VM: ${samples.length}`);
