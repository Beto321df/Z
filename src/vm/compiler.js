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
            idx = this.constants.length; // Índice base 1 para Lua
        } else {
            idx = idx + 1;
        }
        return idx;
    }

    compileNode(node, currentReg = 1) {
        if (!node) return currentReg;

        // 1. Bloques de código (Chunk, Block, DoStatement)
        if (node.type === 'Chunk' || node.type === 'Block' || node.type === 'DoStatement') {
            let reg = currentReg;
            for (const stmt of (node.body || [])) {
                reg = this.compileNode(stmt, currentReg);
            }
            return reg;
        }

        // 2. Literales
        if (node.type === 'StringLiteral' || node.type === 'NumericLiteral' || node.type === 'BooleanLiteral') {
            const constIdx = this.addConstant(node.value);
            this.instructions.push(['LOADK', currentReg, constIdx, 0]);
            return currentReg;
        }

        if (node.type === 'NilLiteral') {
            const constIdx = this.addConstant(null);
            this.instructions.push(['LOADK', currentReg, constIdx, 0]);
            return currentReg;
        }

        // 3. Variables Identificadoras
        if (node.type === 'Identifier') {
            const constIdx = this.addConstant(node.name);
            this.instructions.push(['GETGLOBAL', currentReg, constIdx, 0]);
            return currentReg;
        }

        // 4. Llamadas a función estándar
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

            // C = 2 para guardar 1 valor de retorno en funcReg
            this.instructions.push(['CALL', funcReg, args.length + 1, 2]);
            return funcReg;
        }

        // 4b. Llamadas a método con dos puntos (ej: game:GetService("..."))
        if (node.type === 'SendExpression') {
            const funcReg = currentReg;
            const selfReg = currentReg + 1;

            // Obtener el objeto base (ej: game) en selfReg
            this.compileNode(node.base, selfReg);

            // Extraer el método (ej: GetService) de selfReg a funcReg
            const methodKey = node.method ? node.method.name : 'method';
            const keyIdx = this.addConstant(methodKey);
            this.instructions.push(['GETTABLE', funcReg, selfReg, keyIdx]);

            // Evaluar argumentos después de self
            const args = node.arguments || [];
            for (let i = 0; i < args.length; i++) {
                this.compileNode(args[i], selfReg + 1 + i);
            }

            // CALL: A=funcReg, B=args.length+2 (self + args), C=2 (guardar retorno en funcReg)
            this.instructions.push(['CALL', funcReg, args.length + 2, 2]);
            return funcReg;
        }

        // 5. Asignaciones (local x = 10 / y = "hola")
        if (node.type === 'AssignmentStatement' || node.type === 'LocalStatement') {
            const init = node.init || [];
            const variables = node.variables || node.init || [];
            for (let i = 0; i < variables.length; i++) {
                const valReg = currentReg + i;
                if (init[i]) {
                    this.compileNode(init[i], valReg);
                } else {
                    const constIdx = this.addConstant(null);
                    this.instructions.push(['LOADK', valReg, constIdx, 0]);
                }

                const v = variables[i];
                if (v && v.type === 'Identifier') {
                    const constIdx = this.addConstant(v.name);
                    this.instructions.push(['SETGLOBAL', valReg, constIdx, 0]);
                } else if (v && (v.type === 'MemberExpression' || v.type === 'IndexExpression')) {
                    const baseReg = valReg + 1;
                    this.compileNode(v.base, baseReg);
                    const keyProp = v.identifier ? v.identifier.name : (v.index ? (typeof v.index === 'object' ? v.index.value : v.index) : 'key');
                    const keyIdx = this.addConstant(keyProp);
                    this.instructions.push(['SETTABLE', baseReg, keyIdx, valReg]);
                }
            }
            return currentReg;
        }

        // 6. Indexación de Tablas (tbl.key o tbl["key"])
        if (node.type === 'MemberExpression' || node.type === 'IndexExpression') {
            const baseReg = currentReg;
            this.compileNode(node.base, baseReg);

            let keyVal = null;
            if (node.identifier) {
                keyVal = node.identifier.name;
            } else if (node.index) {
                if (node.index.type === 'StringLiteral' || node.index.type === 'NumericLiteral') {
                    keyVal = node.index.value;
                } else {
                    const keyReg = baseReg + 1;
                    this.compileNode(node.index, keyReg);
                    this.instructions.push(['GETTABLE', currentReg, baseReg, keyReg]);
                    return currentReg;
                }
            }

            const keyIdx = this.addConstant(keyVal);
            this.instructions.push(['GETTABLE', currentReg, baseReg, keyIdx]);
            return currentReg;
        }

        // 7. Declaración de Tablas {}
        if (node.type === 'TableConstructorExpression' || node.type === 'TableKeyString' || node.type === 'TableKey') {
            const tblReg = currentReg;
            this.instructions.push(['NEWTABLE', tblReg, 0, 0]);

            const fields = node.fields || [];
            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];
                const valReg = tblReg + 1;

                if (field.type === 'TableKeyString' || field.type === 'TableKey') {
                    const keyProp = field.key ? (field.key.name || field.key.value) : i + 1;
                    const keyIdx = this.addConstant(keyProp);
                    this.compileNode(field.value, valReg);
                    this.instructions.push(['SETTABLE', tblReg, keyIdx, valReg]);
                } else if (field.type === 'TableValue' || field.value) {
                    const val = field.value || field;
                    const keyIdx = this.addConstant(i + 1);
                    this.compileNode(val, valReg);
                    this.instructions.push(['SETTABLE', tblReg, keyIdx, valReg]);
                }
            }
            return tblReg;
        }

        // 8. Operaciones Matemáticas y Lógicas
        if (node.type === 'BinaryExpression') {
            const leftReg = currentReg;
            const rightReg = currentReg + 1;

            this.compileNode(node.left, leftReg);
            this.compileNode(node.right, rightReg);

            const opMap = {
                '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV',
                '%': 'MOD', '^': 'POW', '..': 'CONCAT',
                '==': 'EQ', '~=': 'NEQ', '<': 'LT', '<=': 'LE', '>': 'GT', '>=': 'GE'
            };

            const opName = opMap[node.operator] || 'ADD';
            this.instructions.push([opName, currentReg, leftReg, rightReg]);
            return currentReg;
        }

        // 9. Operadores Unarios
        if (node.type === 'UnaryExpression') {
            const argReg = currentReg;
            this.compileNode(node.argument, argReg);

            const opMap = { 'not': 'NOT', '-': 'UNM', '#': 'LEN' };
            const opName = opMap[node.operator] || 'NOT';
            this.instructions.push([opName, currentReg, argReg, 0]);
            return currentReg;
        }

        // 10. Declaración de Funciones
        if (node.type === 'FunctionDeclaration') {
            if (node.identifier) {
                const funcName = node.identifier.name;
                const constIdx = this.addConstant(funcName);

                const subCompiler = new BytecodeCompiler();
                subCompiler.constants = this.constants;
                subCompiler.compileNode(node.body, 1);
                subCompiler.instructions.push(['RETURN', 0, 1, 0]);

                const closureIdx = this.addConstant(subCompiler.instructions);
                this.instructions.push(['CLOSURE', currentReg, closureIdx, 0]);
                this.instructions.push(['SETGLOBAL', currentReg, constIdx, 0]);
            }
            return currentReg;
        }

        // 11. Condicionales e Iteradores
        if (node.type === 'IfStatement') {
            for (const clause of (node.clauses || [])) {
                if (clause.condition) this.compileNode(clause.condition, currentReg);
                this.compileNode(clause.body, currentReg);
            }
            return currentReg;
        }

        if (node.type === 'WhileStatement' || node.type === 'RepeatStatement' || node.type === 'ForNumericStatement' || node.type === 'ForGenericStatement') {
            if (node.condition) this.compileNode(node.condition, currentReg);
            if (node.body) this.compileNode(node.body, currentReg);
            return currentReg;
        }

        // 12. Return
        if (node.type === 'ReturnStatement') {
            const args = node.arguments || [];
            for (let i = 0; i < args.length; i++) {
                this.compileNode(args[i], currentReg + i);
            }
            this.instructions.push(['RETURN', currentReg, args.length + 1, 0]);
            return currentReg;
        }

        return currentReg;
    }

    compile(ast) {
        this.constants = [];
        this.instructions = [];
        this.compileNode(ast, 1);
        this.instructions.push(['RETURN', 0, 1, 0]);

        return {
            constants: this.constants,
            instructions: this.instructions
        };
    }
}

module.exports = { BytecodeCompiler };
