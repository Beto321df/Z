const { OPS, BIN, UNARY, buildProgram } = require('./compiler3');
const { encodeProgram } = require('./format3');
const { encodeBytecode, decodeBytecode, ALPHABET, checksum } = require('./codec');

function compile(source) {
    const program = buildProgram(source);
    return {
        program,
        bytecode: encodeProgram(program)
    };
}

module.exports = {
    OPS,
    BIN,
    UNARY,
    ALPHABET,
    checksum,
    buildProgram,
    encodeProgram,
    encodeBytecode,
    decodeBytecode,
    compile
};
