const { TokenType, KEYWORDS } = require('./tokens.js');

class Tokenizer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
    }

    tokenize() {
        const tokens = [];
        while (this.pos < this.input.length) {
            const char = this.input[this.pos];

            if (/\s/.test(char)) {
                this.pos++;
                continue;
            }

            // Comentarios (omitir)
            if (char === '-' && this.input[this.pos + 1] === '-') {
                this.pos += 2;
                while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
                    this.pos++;
                }
                continue;
            }

            // Strings
            if (char === '"' || char === "'") {
                const quote = char;
                let str = '';
                this.pos++;
                while (this.pos < this.input.length && this.input[this.pos] !== quote) {
                    str += this.input[this.pos];
                    this.pos++;
                }
                this.pos++;
                tokens.push({ type: TokenType.STRING, value: str });
                continue;
            }

            // Números
            if (/\d/.test(char)) {
                let num = '';
                while (this.pos < this.input.length && /[\d.]/.test(this.input[this.pos])) {
                    num += this.input[this.pos];
                    this.pos++;
                }
                tokens.push({ type: TokenType.NUMBER, value: parseFloat(num) });
                continue;
            }

            // Identificadores / Palabras clave
            if (/[a-zA-Z_]/.test(char)) {
                let id = '';
                while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
                    id += this.input[this.pos];
                    this.pos++;
                }
                const type = KEYWORDS.has(id) ? TokenType.KEYWORD : TokenType.IDENTIFIER;
                tokens.push({ type, value: id });
                continue;
            }

            // Operadores y Símbolos
            if (/[=+\-*/%^#~<>]/.test(char)) {
                tokens.push({ type: TokenType.OPERATOR, value: char });
                this.pos++;
                continue;
            }

            tokens.push({ type: TokenType.SYMBOL, value: char });
            this.pos++;
        }

        tokens.push({ type: TokenType.EOF, value: null });
        return tokens;
    }
}

module.exports = Tokenizer;
