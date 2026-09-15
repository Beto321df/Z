const { OPS, BIN, UNARY, buildProgram } = require('./nativeCompiler3');
const LuauParser = require('../parser/luauParser');
const Tokenizer = require('../lexer/tokenizer');
const { encodeProgram } = require('./format3');
const { encodeBytecode, decodeBytecode, ALPHABET, checksum } = require('./codec');

function parse(source) {
    return new LuauParser(source).parse();
}

function lex(source) {
    return new Tokenizer(source).tokenize();
}

function compile(source) {
    const program = buildProgram(source);
    return { program, bytecode: encodeProgram(program) };
}

module.exports = {
    OPS, BIN, UNARY, ALPHABET, checksum,
    Tokenizer,
    LuauParser,
    lex,
    parse,
    buildProgram,
    encodeProgram,
    encodeBytecode,
    decodeBytecode,
    compile
};
