const assert = require('assert');
const CodeGenerator = require('../src/generator/codegen.js');
const { buildProgram, OPS } = require('../src/zlang/compiler3');
const { encodeProgram } = require('../src/zlang/format3');
const { encodeBytecode, decodeBytecode, ALPHABET, checksum } = require('../src/zlang/codec');

function assertSymbolOnly(packet) {
    for (const part of packet.z) {
        assert(/^[0-9!@#$%^&*(_+\-=:;<>,.?/|]*$/.test(part.s), 'El payload contiene caracteres fuera del alfabeto Z.');
        assert(!/[A-Za-z]/.test(part.s), 'El payload no debe contener letras.');
        assert(!/\s/.test(part.s), 'El payload no debe contener espacios.');
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
    'print("Hello from Z3")',
    'local x = 10 + 20\nprint(x)',
    'local t = {a = 1, b = "ok"}\nprint(t.a, t.b)',
    'game:GetService("Players")',
    'for i = 1, 5 do print(i) end',
    'local sum = 0\nfor i = 1, 5 do sum = sum + i end\nprint(sum)',
    'local x = 0\nwhile x < 3 do x = x + 1 end\nprint(x)',
    'local function add(a,b) return a+b end\nprint(add(2,3))',
    'for k,v in pairs({a=1,b=2}) do print(k,v) end'
];

for (const input of samples) {
    const program = buildProgram(input);
    validateProgram(program);

    const raw = encodeProgram(program);
    assert(raw.length > 16);
    const packet = encodeBytecode(raw);
    assert.strictEqual(packet.a, ALPHABET);
    assertSymbolOnly(packet);
    const decoded = decodeBytecode(packet);
    assert.strictEqual(Buffer.from(decoded).toString('hex'), Buffer.from(raw).toString('hex'));
    assert.strictEqual(checksum(decoded), packet.h);

    const generated = new CodeGenerator().generate(input);
    assert.strictEqual(typeof generated, 'string');
    assert(generated.length > input.length, 'El resultado no debe ser trivial.');
    assert(!/\n/.test(generated), 'El resultado Z debe salir en una sola línea.');
    assert(!generated.includes(input), 'El código fuente no debe aparecer literalmente en la salida.');
}

console.log('Z-Lang 3 bytecode pipeline: OK');
console.log(`Muestras compiladas: ${samples.length}`);
