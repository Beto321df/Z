class VMCompiler {
    compile(ast) {
        const opcodes = [];
        if (ast && ast.body) {
            for (const stmt of ast.body) {
                if (stmt.type === 'LocalStatement') {
                    opcodes.push([0x01, stmt.names[0] || 'local', 100]);
                } else if (stmt.type === 'CallStatement') {
                    opcodes.push([0x02, stmt.expression.callee ? stmt.expression.callee.name : 'print']);
                }
            }
        }
        return opcodes;
    }
}

module.exports = VMCompiler;
