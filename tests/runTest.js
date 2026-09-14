const assert = require('assert');
const CodeGenerator = require('../src/generator/codegen.js');
const { tokenize } = require('../src/zlang/lexer');
const { ZCompiler } = require('../src/zlang/compiler');
const { encodeBytecode, decodeBytecode, ALPHABET } = require('../src/zlang/codec');
const { decodeIR } = require('../src/zlang/runtime');

function assertSymbolOnly(packet) {
    for (const part of packet.z) {
        assert(/^[0-9!@#$%^&*(_+\-=:;<>,.?/|]*$/.test(part.s), 'El payload contiene caracteres fuera del alfabeto Z.');
        assert(!/[A-Za-z]/.test(part.s), 'El payload no debe contener letras.');
        assert(!/\s/.test(part.s), 'El payload no debe contener espacios.');
    }
}

const samples = [
    'print("Hello from Z")',
    'local x = 10 + 20\nprint(x)',
    'local t = {a = 1, b = "ok"}\nprint(t.a, t.b)',
    'game:GetService("Players"):GetPlayers()',
    'for i = 1, 5 do print(i) end'
];

for (const input of samples) {
    const tokens = tokenize(input);
    const ir = new ZCompiler().compile(tokens);
    const packet = encodeBytecode(ir);
    assert.strictEqual(packet.a, ALPHABET);
    assertSymbolOnly(packet);
    const restored = decodeIR(decodeBytecode(packet));
    assert.strictEqual(restored, input, `Roundtrip failed for: ${input}`);

    const generated = new CodeGenerator().generate(input);
    assert.strictEqual(typeof generated, 'string');
    assert(generated.length > input.length, 'El resultado no debe ser trivial.');
    assert(!/\n/.test(generated), 'El resultado Z debe salir en una sola línea.');
}

console.log('Z-Lang pipeline: OK');
console.log(`Muestras verificadas: ${samples.length}`);
