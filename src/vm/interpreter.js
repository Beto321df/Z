const { decodeIR } = require('../zlang/runtime');

class LuauInterpreterGenerator {
    decode(irBytes) {
        return decodeIR(irBytes);
    }

    generateRunner(bytecode) {
        const ir = bytecode && bytecode.ir ? bytecode.ir : bytecode;
        if (!ir) throw new Error('Z runtime recibió bytecode vacío.');
        const source = decodeIR(ir);
        return `local f,e=(loadstring or load)(${JSON.stringify(source)});if not f then error(e) end;return f()`;
    }
}

module.exports = LuauInterpreterGenerator;
