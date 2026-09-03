const fs = require('fs');
const path = require('path');

const Tokenizer = require('../src/lexer/tokenizer');
const Parser = require('../src/parser/parser');
const StringEncoderTransform = require('../src/transforms/stringEncoder');
const DeadCodeTransform = require('../src/transforms/deadCode');
const VMCompiler = require('../src/vm/compiler');
const VMInterpreterGenerator = require('../src/vm/interpreter');
const CodeGenerator = require('../src/generator/codegen');

// Leer archivo de prueba
const sampleLua = fs.readFileSync(path.join(__dirname, 'input.lua'), 'utf-8');

console.log("--- CÓDIGO ORIGINAL ---");
console.log(sampleLua);

// Pipeline
const tokenizer = new Tokenizer(sampleLua);
const tokens = tokenizer.tokenize();

const parser = new Parser(tokens);
const ast = parser.parse();

const stringTable = new Map();
const stringEncoder = new StringEncoderTransform();
stringEncoder.transformNode(ast, stringTable);

const deadCode = new DeadCodeTransform();
if (ast.body) {
    ast.body = deadCode.inject(ast.body);
}

const compiler = new VMCompiler();
const bytecode = compiler.compile(ast);

const interpreterGen = new VMInterpreterGenerator();
const vmCode = interpreterGen.generate(bytecode, stringTable);

const generator = new CodeGenerator();
const result = generator.generate(vmCode);

console.log("\n--- RESULTADO OFUSCADO (15 CARACTERES) ---");
console.log(result);
