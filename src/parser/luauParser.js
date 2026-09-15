const ASTNode = require('./ast.js');
const Tokenizer = require('../lexer/tokenizer.js');
const { TokenType } = require('../lexer/tokens.js');

const BINARY_PRECEDENCE = Object.freeze({
    or: 1,
    and: 2,
    '==': 3, '~=': 3, '<': 3, '>': 3, '<=': 3, '>=': 3,
    '..': 4,
    '+': 5, '-': 5,
    '*': 6, '/': 6, '//': 6, '%': 6,
    '^': 8
});
const RIGHT_ASSOCIATIVE = new Set(['..', '^']);
const UNARY = new Set(['not', '-', '#']);
const COMPOUND = Object.freeze({ '+=': '+', '-=': '-', '*=': '*', '/=': '/', '%=': '%', '..=': '..' });

class LuauParser {
    constructor(inputOrTokens) {
        this.tokens = Array.isArray(inputOrTokens) ? inputOrTokens : new Tokenizer(inputOrTokens).tokenize();
        this.pos = 0;
    }
    current() { return this.tokens[this.pos] || this.tokens[this.tokens.length - 1]; }
    peek(offset = 0) { return this.tokens[this.pos + offset] || this.tokens[this.tokens.length - 1]; }
    value(offset = 0) { return this.peek(offset).value; }
    is(value) { return this.value() === value; }
    isType(type) { return this.current().type === type; }
    consume(value) {
        if (value !== undefined && !this.is(value)) this.error(`se esperaba '${value}', llegó '${this.value()}'`);
        return this.tokens[this.pos++];
    }
    match(value) { if (!this.is(value)) return false; this.pos += 1; return true; }
    error(message, token = this.current()) {
        const loc = token?.start || { line: 1, column: 1, index: 0 };
        const error = new SyntaxError(`Z Parser: ${message} at ${loc.line}:${loc.column}`);
        error.line = loc.line; error.column = loc.column; error.index = loc.index;
        throw error;
    }
    parse() {
        const body = [];
        while (!this.isType(TokenType.EOF)) {
            this.skipSeparators();
            if (this.isType(TokenType.EOF)) break;
            body.push(this.parseStatement());
            this.skipSeparators();
        }
        return new ASTNode('Chunk', { body });
    }
    module() { return this.parse(); }
    skipSeparators() { while (this.match(';')) {} }
    parseStatement() {
        switch (this.value()) {
            case 'local': return this.parseLocal();
            case 'function': return this.parseFunctionDeclaration(false);
            case 'return': return this.parseReturn();
            case 'if': return this.parseIf();
            case 'while': return this.parseWhile();
            case 'repeat': return this.parseRepeat();
            case 'do': return this.parseDo();
            case 'for': return this.parseFor();
            case 'break': this.consume(); return new ASTNode('BreakStatement');
            case 'continue': this.consume(); return new ASTNode('ContinueStatement');
            case 'goto': return this.parseGoto();
            case 'type':
            case 'export': return this.parseTypeDeclaration();
            default: return this.parseExpressionStatementOrAssignment();
        }
    }
    parseExpressionStatementOrAssignment() {
        const first = this.parsePrefixExpression();

        // Lua/Luau allows multiple assignment targets: a, b = ...
        // Previously the parser checked for '=' before consuming the comma,
        // so valid generated VM statements such as "x, y = read()" failed.
        if (!this.isAssignmentOperator() && !this.is(',')) {
            if (['CallExpression', 'TableCallExpression', 'StringCallExpression'].includes(first.type)) return new ASTNode('CallStatement', { expression: first });
            this.error('sentencia inesperada; se esperaba llamada o asignación');
        }

        const variables = [this.ensureAssignable(first)];
        while (this.match(',')) variables.push(this.ensureAssignable(this.parsePrefixExpression()));

        if (!this.isAssignmentOperator()) this.error('se esperaba asignación después de la lista de destinos');
        const operator = this.consume().value;
        const init = this.parseExpressionList();
        if (operator === '=') return new ASTNode('AssignmentStatement', { variables, init });
        if (variables.length !== 1 || init.length !== 1 || !COMPOUND[operator]) this.error(`asignación compuesta inválida '${operator}'`);
        return new ASTNode('AssignmentStatement', { variables, init: [new ASTNode('BinaryExpression', { operator: COMPOUND[operator], left: this.cloneLValueRead(variables[0]), right: init[0] })] });
    }
    parseLocal() {
        this.consume('local');
        if (this.is('function')) return this.parseFunctionDeclaration(true);
        const variables = [];
        do {
            const token = this.consume();
            if (token.type !== TokenType.IDENTIFIER) this.error('se esperaba un identificador después de local', token);
            variables.push(new ASTNode('Identifier', { name: token.value }));
            this.skipTypeAnnotation();
        } while (this.match(','));
        return new ASTNode('LocalStatement', { variables, init: this.match('=') ? this.parseExpressionList() : [] });
    }
    parseFunctionDeclaration(isLocal) {
        this.consume('function');
        const identifier = this.parseFunctionName();
        const parameters = this.parseParameters();
        const isVararg = parameters.some(p => p.type === 'VarargParameter');
        const realParameters = parameters.filter(p => p.type !== 'VarargParameter');
        const body = this.parseBlock(['end']);
        this.consume('end');
        return new ASTNode('FunctionDeclaration', { identifier, parameters: realParameters, isLocal, isVararg, body });
    }
    parseFunctionName() {
        const first = this.consume();
        if (first.type !== TokenType.IDENTIFIER) this.error('nombre de función inválido', first);
        let result = new ASTNode('Identifier', { name: first.value });
        while (this.match('.')) {
            const part = this.consume();
            if (part.type !== TokenType.IDENTIFIER) this.error('miembro de función inválido', part);
            result = new ASTNode('MemberExpression', { base: result, identifier: new ASTNode('Identifier', { name: part.value }), indexer: '.' });
        }
        if (this.match(':')) {
            const part = this.consume();
            if (part.type !== TokenType.IDENTIFIER) this.error('método de función inválido', part);
            result = new ASTNode('MemberExpression', { base: result, identifier: new ASTNode('Identifier', { name: part.value }), indexer: ':' });
        }
        return result;
    }
    parseParameters() {
        this.consume('(');
        const params = [];
        if (!this.is(')')) {
            do {
                if (this.match('...')) { params.push(new ASTNode('VarargParameter')); break; }
                const token = this.consume();
                if (token.type !== TokenType.IDENTIFIER) this.error('parámetro inválido', token);
                this.skipTypeAnnotation();
                if (this.match('=')) this.parseExpression();
                params.push(new ASTNode('Identifier', { name: token.value }));
            } while (this.match(','));
        }
        this.consume(')');
        this.skipReturnTypeAnnotation();
        return params;
    }
    parseReturn() {
        this.consume('return');
        if (this.is(';') || this.is('end') || this.is('elseif') || this.is('else') || this.is('until') || this.isType(TokenType.EOF)) return new ASTNode('ReturnStatement', { arguments: [] });
        return new ASTNode('ReturnStatement', { arguments: this.parseExpressionList() });
    }
    parseIf() {
        this.consume('if');
        const clauses = [];
        clauses.push(this.parseIfClause());
        while (this.match('elseif')) clauses.push(this.parseIfClause());
        if (this.match('else')) clauses.push(new ASTNode('ElseClause', { body: this.parseBlock(['end']) }));
        this.consume('end');
        return new ASTNode('IfStatement', { clauses });
    }
    parseIfClause() {
        const condition = this.parseExpression();
        this.consume('then');
        return new ASTNode('IfClause', { condition, body: this.parseBlock(['elseif', 'else', 'end']) });
    }
    parseWhile() {
        this.consume('while'); const condition = this.parseExpression(); this.consume('do');
        const body = this.parseBlock(['end']); this.consume('end');
        return new ASTNode('WhileStatement', { condition, body });
    }
    parseRepeat() {
        this.consume('repeat'); const body = this.parseBlock(['until']); this.consume('until');
        return new ASTNode('RepeatStatement', { body, condition: this.parseExpression() });
    }
    parseDo() {
        this.consume('do'); const body = this.parseBlock(['end']); this.consume('end');
        return new ASTNode('DoStatement', { body });
    }
    parseFor() {
        this.consume('for');
        const firstToken = this.consume();
        if (firstToken.type !== TokenType.IDENTIFIER) this.error('variable de for inválida', firstToken);
        const first = new ASTNode('Identifier', { name: firstToken.value });
        this.skipTypeAnnotation();
        if (this.match('=')) {
            const start = this.parseExpression(); this.consume(','); const end = this.parseExpression();
            const step = this.match(',') ? this.parseExpression() : null;
            this.consume('do'); const body = this.parseBlock(['end']); this.consume('end');
            return new ASTNode('ForNumericStatement', { variable: first, start, end, step, body });
        }
        const variables = [first];
        while (this.match(',')) {
            const token = this.consume(); if (token.type !== TokenType.IDENTIFIER) this.error('variable de for inválida', token);
            this.skipTypeAnnotation(); variables.push(new ASTNode('Identifier', { name: token.value }));
        }
        this.consume('in'); const iterators = this.parseExpressionList(); this.consume('do');
        const body = this.parseBlock(['end']); this.consume('end');
        return new ASTNode('ForGenericStatement', { variables, iterators, body });
    }
    parseBlock(terminators) {
        const body = [];
        while (!this.isType(TokenType.EOF) && !terminators.includes(this.value())) {
            this.skipSeparators();
            if (this.isType(TokenType.EOF) || terminators.includes(this.value())) break;
            body.push(this.parseStatement());
            this.skipSeparators();
        }
        return body;
    }
    parseExpressionList() { const list = [this.parseExpression()]; while (this.match(',')) list.push(this.parseExpression()); return list; }
    parseExpression(minPrecedence = 1) {
        let left = this.parseUnaryExpression();
        while (true) {
            const operator = this.value(); const precedence = BINARY_PRECEDENCE[operator];
            if (!precedence || precedence < minPrecedence) break;
            this.consume();
            const right = this.parseExpression(RIGHT_ASSOCIATIVE.has(operator) ? precedence : precedence + 1);
            left = new ASTNode(operator === 'and' || operator === 'or' ? 'LogicalExpression' : 'BinaryExpression', { operator, left, right });
        }
        return left;
    }
    parseUnaryExpression() {
        if (UNARY.has(this.value())) { const operator = this.consume().value; return new ASTNode('UnaryExpression', { operator, argument: this.parseUnaryExpression() }); }
        return this.parsePrefixExpression();
    }
    parsePrefixExpression() {
        let expression = this.parsePrimaryExpression();
        while (true) {
            if (this.match('.')) {
                const token = this.consume(); if (token.type !== TokenType.IDENTIFIER) this.error('miembro inválido', token);
                expression = new ASTNode('MemberExpression', { base: expression, identifier: new ASTNode('Identifier', { name: token.value }), indexer: '.' }); continue;
            }
            if (this.match('[')) { const index = this.parseExpression(); this.consume(']'); expression = new ASTNode('IndexExpression', { base: expression, index }); continue; }
            if (this.match(':')) {
                const token = this.consume(); if (token.type !== TokenType.IDENTIFIER) this.error('método inválido', token);
                const member = new ASTNode('MemberExpression', { base: expression, identifier: new ASTNode('Identifier', { name: token.value }), indexer: ':' });
                expression = this.parseCallAfterBase(member); continue;
            }
            if (this.is('(') || this.is('{') || this.isType(TokenType.STRING)) { expression = this.parseCallAfterBase(expression); continue; }
            break;
        }
        return expression;
    }
    parseCallAfterBase(base) {
        if (this.is('(')) return new ASTNode('CallExpression', { base, arguments: this.parseArguments() });
        if (this.is('{')) return new ASTNode('TableCallExpression', { base, arguments: [this.parseTableConstructor()] });
        if (this.isType(TokenType.STRING)) { const token = this.consume(); return new ASTNode('StringCallExpression', { base, argument: new ASTNode('StringLiteral', { value: token.value }) }); }
        this.error('argumento de llamada inválido');
    }
    parseArguments() {
        this.consume('('); const args = [];
        if (!this.is(')')) do { args.push(this.parseExpression()); } while (this.match(','));
        this.consume(')'); return args;
    }
    parsePrimaryExpression() {
        const token = this.current();
        if (token.type === TokenType.NUMBER) { this.consume(); return new ASTNode('NumericLiteral', { value: token.value }); }
        if (token.type === TokenType.STRING) { this.consume(); return new ASTNode('StringLiteral', { value: token.value }); }
        if (token.value === 'true' || token.value === 'false') { this.consume(); return new ASTNode('BooleanLiteral', { value: token.value === 'true' }); }
        if (token.value === 'nil') { this.consume(); return new ASTNode('NilLiteral'); }
        if (token.value === '...') { this.consume(); return new ASTNode('VarargLiteral'); }
        if (token.type === TokenType.IDENTIFIER) { this.consume(); return new ASTNode('Identifier', { name: token.value }); }
        if (this.match('(')) { const value = this.parseExpression(); this.consume(')'); return value; }
        if (this.is('{')) return this.parseTableConstructor();
        if (this.is('function')) return this.parseFunctionExpression();
        this.error(`expresión inesperada '${token.value}'`, token);
    }
    parseFunctionExpression() {
        this.consume('function'); const parameters = this.parseParameters();
        const isVararg = parameters.some(p => p.type === 'VarargParameter');
        const realParameters = parameters.filter(p => p.type !== 'VarargParameter');
        const body = this.parseBlock(['end']); this.consume('end');
        return new ASTNode('FunctionExpression', { parameters: realParameters, isVararg, body });
    }
    parseTableConstructor() {
        this.consume('{'); const fields = []; let arrayIndex = 1;
        while (!this.is('}') && !this.isType(TokenType.EOF)) {
            let field;
            if (this.match('[')) {
                const key = this.parseExpression(); this.consume(']'); this.consume('=');
                field = new ASTNode('TableKey', { key, value: this.parseExpression() });
            } else if (this.isType(TokenType.IDENTIFIER) && this.value(1) === '=') {
                const name = this.consume().value; this.consume('=');
                field = new ASTNode('TableKeyString', { key: new ASTNode('Identifier', { name }), value: this.parseExpression() });
            } else {
                field = new ASTNode('TableValue', { value: this.parseExpression(), index: arrayIndex++ });
            }
            fields.push(field);
            if (!this.match(',') && !this.match(';')) break;
        }
        this.consume('}'); return new ASTNode('TableConstructorExpression', { fields });
    }
    ensureAssignable(node) {
        if (!['Identifier', 'MemberExpression', 'IndexExpression'].includes(node.type)) this.error(`destino no asignable: ${node.type}`);
        return node;
    }
    cloneLValueRead(node) {
        if (node.type === 'Identifier') return new ASTNode('Identifier', { name: node.name });
        if (node.type === 'MemberExpression') return new ASTNode('MemberExpression', { base: node.base, identifier: node.identifier, indexer: node.indexer });
        if (node.type === 'IndexExpression') return new ASTNode('IndexExpression', { base: node.base, index: node.index });
        this.error('lvalue inválido');
    }
    skipTypeAnnotation() {
        if (!this.is(':')) return;
        this.consume(':'); let depth = 0;
        while (!this.isType(TokenType.EOF)) {
            const v = this.value();
            if (depth === 0 && (v === '=' || v === ',' || v === ')' || v === 'then' || v === 'do' || v === 'end')) break;
            if (v === '<' || v === '{' || v === '(' || v === '[') depth += 1;
            else if (v === '>' || v === '}' || v === ')' || v === ']') depth = Math.max(0, depth - 1);
            this.consume();
        }
    }
    skipReturnTypeAnnotation() { if (this.is(':')) this.skipTypeAnnotation(); }
    parseTypeDeclaration() {
        if (this.match('export')) this.match('type'); else this.consume('type');
        const name = this.consume().value; this.skipTypeAnnotation();
        return new ASTNode('TypeDeclaration', { name, value: this.match('=') ? this.parseExpression() : null });
    }
    parseGoto() { this.consume('goto'); return new ASTNode('GotoStatement', { label: this.consume().value }); }
    isAssignmentOperator() { return this.is('=') || Object.prototype.hasOwnProperty.call(COMPOUND, this.value()); }
}

module.exports = LuauParser;
