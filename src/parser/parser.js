const { TokenType } = require('../lexer/tokens');
const AST = require('./ast');

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    peek() {
        return this.tokens[this.pos] || { type: TokenType.EOF, value: null };
    }

    consume() {
        return this.tokens[this.pos++];
    }

    parse() {
        const body = [];
        while (this.peek().type !== TokenType.EOF) {
            const stmt = this.parseStatement();
            if (stmt) body.push(stmt);
        }
        return new AST.ChunkNode(body);
    }

    parseStatement() {
        const token = this.peek();

        if (token.type === TokenType.KEYWORD && token.value === 'local') {
            this.consume();
            const names = [];
            while (this.peek().type === TokenType.IDENTIFIER) {
                names.push(this.consume().value);
                if (this.peek().value === ',') this.consume();
                else break;
            }
            let init = [];
            if (this.peek().value === '=') {
                this.consume();
                init.push(this.parseExpression());
            }
            return new AST.LocalStatementNode(names, init);
        }

        if (token.type === TokenType.IDENTIFIER) {
            const expr = this.parseExpression();
            if (this.peek().value === '=') {
                this.consume();
                const value = this.parseExpression();
                return new AST.AssignmentStatementNode([expr], [value]);
            }
            return new AST.CallStatementNode(expr);
        }

        this.consume();
        return null;
    }

    parseExpression() {
        const token = this.peek();

        if (token.type === TokenType.IDENTIFIER) {
            const callee = new AST.IdentifierNode(this.consume().value);
            if (this.peek().value === '(') {
                this.consume();
                const args = [];
                while (this.peek().value !== ')' && this.peek().type !== TokenType.EOF) {
                    args.push(this.parseExpression());
                    if (this.peek().value === ',') this.consume();
                }
                if (this.peek().value === ')') this.consume();
                return new AST.FunctionCallNode(callee, args);
            }
            return callee;
        }

        if (token.type === TokenType.STRING) {
            return new AST.StringLiteralNode(this.consume().value);
        }

        if (token.type === TokenType.NUMBER) {
            return new AST.NumberLiteralNode(this.consume().value);
        }

        this.consume();
        return new AST.StringLiteralNode('');
    }
}

module.exports = Parser;
