const CodeGenerator = require('../src/generator/codegen.js');

const inputScript = 'print("Hello from Z-Protector VM")';
const generator = new CodeGenerator();
const output = generator.generate(inputScript);

console.log("=== CÓDIGO FINAL DE LA VM GENERADO ===");
console.log(output);
