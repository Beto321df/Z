const { tokenize, TOKEN_TYPES } = require('./lexer');
const { ZCompiler, OPCODES } = require('./compiler');
const { encodeBytecode, decodeBytecode, ALPHABET, checksum } = require('./codec');
const { decodeIR } = require('./runtime');

function compile(source) {
    const tokens = tokenize(source);
    const ir = new ZCompiler().compile(tokens);
    return encodeBytecode(ir);
}

function restore(packet) {
    return decodeIR(decodeBytecode(packet));
}

module.exports = {
    TOKEN_TYPES,
    OPCODES,
    ALPHABET,
    checksum,
    tokenize,
    compile,
    restore
};
