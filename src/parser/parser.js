const ASTNode = require('./ast.js');

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    parse() {
        const statements = [];
        while (this.tokens[this.pos].type !== 'EOF') {
            const stmt = this.parseStatement();
            if (stmt) statements.push(stmt);
        }
        return new ASTNode('Chunk', { body: statements });
    }

    parseStatement() {
        const token = this.tokens[this.pos];

        if (token.value === 'local') {
            this.pos++;
            const name = this.tokens[this.pos++].value;
            let value = null;
            if (this.tokens[this.pos] && this.tokens[this.pos].value === '=') {
                this.pos++;
                value = this.parseExpression();
            }
            return new ASTNode('LocalAssignment', { name, value });
        }

        if (token.type === 'IDENTIFIER') {
            const name = token.value;
            this.pos++;
            if (this.tokens[this.pos] && this.tokens[this.pos].value === '(') {
                this.pos++; // '('
                const args = [];
                while (this.tokens[this.pos] && this.tokens[this.pos].value !== ')') {
                    args.push(this.parseExpression());
                    if (this.tokens[this.pos] && this.tokens[this.pos].value === ',') this.pos++;
                }
                this.pos++; // ')'
                return new ASTNode('CallStatement', { name, args });
            }
        }

        this.pos++;
        return null;
    }

    parseExpression() {
        const token = this.tokens[this.pos++];
        return new ASTNode('Literal', { value: token.value, kind: token.type });
    }
}

module.exports = Parser;
