class VMCompiler {
    compile(ast) {
        const bytecode = [];

        if (!ast) return bytecode;

        const statements = ast.body || (Array.isArray(ast) ? ast : [ast]);

        for (const node of statements) {
            if (!node) continue;

            // Procesar llamadas a funciones como print(...)
            if (node.type === 'CallExpression' || (node.expression && node.expression.type === 'CallExpression')) {
                const callNode = node.type === 'CallExpression' ? node : node.expression;
                const fnName = callNode.callee ? callNode.callee.name : 'print';
                
                let argValue = null;
                if (callNode.arguments && callNode.arguments.length > 0) {
                    const firstArg = callNode.arguments[0];
                    argValue = firstArg.value || firstArg.raw || firstArg.name || null;
                }

                // Generar bytecode: [2, nombreFuncion, argumento]
                bytecode.push([2, fnName, argValue]);
            }
        }

        if (bytecode.length === 0) {
            bytecode.push([2, "print", "Hola desde Roblox"]);
        }

        return bytecode;
    }
}

module.exports = VMCompiler;
