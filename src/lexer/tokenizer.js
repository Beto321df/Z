const { TokenType, LUAU_KEYWORDS } = require('./tokens');

class Tokenizer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.length = input.length;
    }

    tokenize() {
        const tokens = [];

        while (this.pos < this.length) {
            const char = this.input[this.pos];

            if (/\s/.test(char)) {
                this.pos++;
                continue;
            }

            if (char === '-' && this.input[this.pos + 1] === '-') {
                this.skipComment();
                continue;
            }

            if (char === '"' || char === "'" || (char === '[' && this.input[this.pos + 1] === '[')) {
                tokens.push(this.readString(char));
                continue;
            }

            if (/\d/.test(char)) {
                tokens.push(this.readNumber());
                continue;
            }

            if (/[a-zA-Z_]/.test(char)) {
                tokens.push(this.readIdentifier());
                continue;
            }

            tokens.push(this.readSymbol());
        }

        tokens.push({ type: TokenType.EOF, value: null });
        return tokens;
    }

    skipComment() {
        this.pos += 2;
        if (this.input.substring(this.pos, this.pos + 2) === '[[') {
            this.pos += 2;
            while (this.pos < this.length && this.input.substring(this.pos, this.pos + 2) !== ']]') {
                this.pos++;
            }
            this.pos += 2;
        } else {
            while (this.pos < this.length && this.input[this.pos] !== '\n') {
                this.pos++;
            }
        }
    }

    readString(quote) {
        if (quote === '[') {
            this.pos += 2;
            let valStart = this.pos;
            while (this.pos < this.length && this.input.substring(this.pos, this.pos + 2) !== ']]') {
                this.pos++;
            }
            let str = this.input.substring(valStart, this.pos);
            this.pos += 2;
            return { type: TokenType.STRING, value: str };
        } else {
            this.pos++;
            let str = '';
            while (this.pos < this.length && this.input[this.pos] !== quote) {
                if (this.input[this.pos] === '\\') {
                    str += this.input[this.pos] + (this.input[this.pos + 1] || '');
                    this.pos += 2;
                } else {
                    str += this.input[this.pos];
                    this.pos++;
                }
            }
            this.pos++;
            return { type: TokenType.STRING, value: str };
        }
    }

    readNumber() {
        let start = this.pos;
        while (this.pos < this.length && /[0-9.xXA-Fa-f]/.test(this.input[this.pos])) {
            this.pos++;
        }
        return { type: TokenType.NUMBER, value: this.input.substring(start, this.pos) };
    }

    readIdentifier() {
        let start = this.pos;
        while (this.pos < this.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
            this.pos++;
        }
        const value = this.input.substring(start, this.pos);
        const type = LUAU_KEYWORDS.has(value) ? TokenType.KEYWORD : TokenType.IDENTIFIER;
        return { type, value };
    }

    readSymbol() {
        const twoChar = this.input.substring(this.pos, this.pos + 2);
        const doubleOps = ['==', '~=', '<=', '>=', '..', '+=', '-=', '*=', '/='];

        if (doubleOps.includes(twoChar)) {
            this.pos += 2;
            return { type: TokenType.SYMBOL, value: twoChar };
        }

        const char = this.input[this.pos];
        this.pos++;
        return { type: TokenType.SYMBOL, value: char };
    }
}

module.exports = Tokenizer;
