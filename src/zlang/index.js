const { OPS, BIN, UNARY, buildProgram } = require('./nativeCompiler3');
const LuauParser = require('../parser/luauParser');
const Tokenizer = require('../lexer/tokenizer');
const { encodeProgram } = require('./format3');
const { encodeBytecode, decodeBytecode, ALPHABET, checksum } = require('./codec');
const { programToIR, validateIR, irToProgram, OP_NAMES } = require('./ir3');

function parse(source) { return new LuauParser(source).parse(); }
function lex(source) { return new Tokenizer(source).tokenize(); }
function compile(source) {
    const program = buildProgram(source);
    const ir = programToIR(program);
    validateIR(ir);
    return { program: irToProgram(ir), ir, bytecode: encodeProgram(program) };
}

module.exports = {
    OPS, BIN, UNARY, ALPHABET, checksum,
    OP_NAMES,
    Tokenizer, LuauParser,
    lex, parse, buildProgram,
    programToIR, validateIR, irToProgram,
    encodeProgram, encodeBytecode, decodeBytecode,
    compile
};
