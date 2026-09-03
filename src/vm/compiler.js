class BytecodeCompiler {
    constructor() {
        this.constants = [];
        this.instructions = [];
        this.registerCount = 1;
    }

    addConstant(val) {
        let idx = this.constants.indexOf(val);
        if (idx === -1) {
            this.constants.push(val);
            idx = this.constants.length; // 1-based index para Lua
        } else {
            idx = idx + 1;
        }
        return idx;
    }

    compileNode(node, currentReg = 1) {
        if (!node) return currentReg;

        // Sentencias / Bloques
        if (node.type === 'Chunk' || node.type === 'Block') {
            let reg = currentReg;
            for (const stmt of (node.body || [])) {
                reg = this.compileNode(stmt, currentReg);
            }
            return reg;
        }

        // Llamadas a función: print("hola"), workspace:FindFirstChild(...)
        if (node.type === 'CallStatement') {
            return this.compileNode(node.expression, currentReg);
        }

        if (node.type === 'CallExpression') {
            const funcReg = currentReg;
            this.compileNode(node.base, funcReg);

            let argReg = funcReg + 1;
            const args = node.arguments || [];
            for (let i = 0; i < args.length; i++) {
                this.compileNode(args[i], argReg + i);
            }

            // OP_CALL: [funcReg, numArgs + 1, numResults + 1]
            this.instructions.push(['CALL', funcReg, args.length + 1, 1]);
            return funcReg;
        }

        // Literales
        if (node.type === 'StringLiteral' || node.type === 'NumericLiteral' || node.type === 'BooleanLiteral') {
            const constIdx = this.addConstant(node.value);
            // OP_LOADK: [reg, constIdx]
            this.instructions.push(['LOADK', currentReg, constIdx, 0]);
            return currentReg;
        }

        // Variables Globales e Identificadores
        if (node.type === 'Identifier') {
            const constIdx = this.addConstant(node.name);
            // OP_GETGLOBAL: [reg, constIdx]
            this.instructions.push(['GETGLOBAL', currentReg, constIdx, 0]);
            return currentReg;
        }

        // Asignaciones: local x = 10 / game = ...
        if (node.type === 'AssignmentStatement' || node.type === 'LocalStatement') {
            const init = node.init || [];
            const variables = node.variables || node.init || [];
            for (let i = 0; i < init.length; i++) {
                const valReg = currentReg + i;
                this.compileNode(init[i], valReg);
                
                if (variables[i] && variables[i].type === 'Identifier') {
                    const constIdx = this.addConstant(variables[i].name);
                    this.instructions.push(['SETGLOBAL', valReg, constIdx, 0]);
                }
            }
            return currentReg;
        }

        // Indexación de Tablas: game.Workspace / tbl["key"]
        if (node.type === 'MemberExpression' || node.type === 'IndexExpression') {
            const baseReg = currentReg;
            this.compileNode(node.base, baseReg);
            
            const keyProp = node.identifier ? node.identifier.name : node.index;
            const keyIdx = this.addConstant(typeof keyProp === 'object' ? keyProp.value : keyProp);
            
            // OP_GETTABLE: [reg, baseReg, keyIdx]
            this.instructions.push(['GETTABLE', currentReg, baseReg, keyIdx]);
            return currentReg;
        }

        return currentReg;
    }

    compile(ast) {
        this.constants = [];
        this.instructions = [];
        this.compileNode(ast, 1);
        
        // OP_RETURN
        this.instructions.push(['RETURN', 0, 1, 0]);

        return {
            constants: this.constants,
            instructions: this.instructions
        };
    }
}

module.exports = { BytecodeCompiler };
