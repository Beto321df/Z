const { TokenType, KEYWORDS, MULTI_CHAR_OPERATORS } = require('./tokens.js');

const IDENT_START = /^(?:_|\p{ID_Start})$/u;
const IDENT_CONTINUE = /^(?:_|\p{ID_Continue})$/u;

class Tokenizer {
    constructor(input) {
        this.input = String(input == null ? '' : input);
        this.pos = 0;
        this.line = 1;
        this.column = 1;
    }

    peek(offset = 0) {
        return this.input[this.pos + offset] || '';
    }

    advance(count = 1) {
        for (let i = 0; i < count && this.pos < this.input.length; i += 1) {
            const char = this.input[this.pos++];
            if (char === '\n') {
                this.line += 1;
                this.column = 1;
            } else {
                this.column += 1;
            }
        }
    }

    location() {
        return { line: this.line, column: this.column, index: this.pos };
    }

    error(message, location = this.location()) {
        const err = new SyntaxError(`Z Lexer: ${message} at ${location.line}:${location.column}`);
        err.index = location.index;
        err.line = location.line;
        err.column = location.column;
        throw err;
    }

    consumeWhile(predicate) {
        let out = '';
        while (this.pos < this.input.length && predicate(this.input[this.pos])) {
            out += this.input[this.pos];
            this.advance();
        }
        return out;
    }

    readLongBracket(openPos) {
        if (this.peek() !== '[') return null;
        let i = openPos + 1;
        let equals = 0;
        while (this.input[i] === '=') {
            equals += 1;
            i += 1;
        }
        if (this.input[i] !== '[') return null;
        const close = `]${'='.repeat(equals)}]`;
        const start = this.pos;
        this.advance(i - openPos + 1);
        const contentStart = this.pos;
        const end = this.input.indexOf(close, this.pos);
        if (end < 0) this.error('long bracket string/comment sin cierre');
        const raw = this.input.slice(contentStart, end);
        this.advance(end - this.pos + close.length);
        return raw;
    }

    readNumber() {
        const start = this.location();
        const rest = this.input.slice(this.pos);
        const match = rest.match(/^(?:0[xX][0-9a-fA-F]+(?:\.[0-9a-fA-F]*)?(?:[pP][+-]?\d+)?|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/);
        if (!match) this.error('número inválido', start);
        const raw = match[0];
        this.advance(raw.length);
        const value = /^0[xX]/.test(raw) ? Number.parseInt(raw.replace(/\.[0-9a-fA-F]*|[pP][+-]?\d+/i, ''), 16) : Number(raw);
        if (!Number.isFinite(value)) this.error(`número inválido: ${raw}`, start);
        return { type: TokenType.NUMBER, value, raw, start };
    }

    readEscape() {
        const start = this.location();
        if (this.peek() !== '\\') return '';
        this.advance();
        if (this.pos >= this.input.length) this.error('escape sin terminar', start);
        const c = this.peek();
        const simple = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', a: '\x07', '\\': '\\', '"': '"', "'": "'" };
        if (Object.prototype.hasOwnProperty.call(simple, c)) {
            this.advance();
            return simple[c];
        }
        if (c === '\n') {
            this.advance();
            return '\n';
        }
        if (c === 'x') {
            this.advance();
            const hex = this.input.slice(this.pos, this.pos + 2);
            if (!/^[0-9a-fA-F]{2}$/.test(hex)) this.error('escape hexadecimal inválido', start);
            this.advance(2);
            return String.fromCharCode(Number.parseInt(hex, 16));
        }
        if (c === 'u' && this.peek(1) === '{') {
            this.advance(2);
            const begin = this.pos;
            while (this.pos < this.input.length && this.peek() !== '}') this.advance();
            const code = this.input.slice(begin, this.pos);
            if (this.peek() !== '}' || !/^[0-9a-fA-F]+$/.test(code)) this.error('escape Unicode inválido', start);
            this.advance();
            const value = Number.parseInt(code, 16);
            if (value > 0x10ffff) this.error('escape Unicode fuera de rango', start);
            return String.fromCodePoint(value);
        }
        if (/\d/.test(c)) {
            let digits = this.consumeWhile(ch => /\d/.test(ch));
            if (digits.length > 3) digits = digits.slice(0, 3);
            const value = Number.parseInt(digits, 10);
            if (value > 255) this.error('escape decimal fuera de rango', start);
            return String.fromCharCode(value);
        }
        this.advance();
        return c;
    }

    readString() {
        const start = this.location();
        const quote = this.peek();
        this.advance();
        let value = '';
        while (this.pos < this.input.length) {
            const c = this.peek();
            if (c === quote) {
                this.advance();
                return { type: TokenType.STRING, value, raw: value, start };
            }
            if (c === '\\') {
                value += this.readEscape();
                continue;
            }
            if (c === '\n' || c === '\r') this.error('string literal sin cerrar', start);
            value += c;
            this.advance();
        }
        this.error('string literal sin cerrar', start);
    }

    readIdentifier() {
        const start = this.location();
        const first = this.peek();
        if (!IDENT_START.test(first)) return null;
        const value = this.consumeWhile(ch => IDENT_CONTINUE.test(ch));
        return {
            type: KEYWORDS.has(value) ? TokenType.KEYWORD : TokenType.IDENTIFIER,
            value,
            raw: value,
            start
        };
    }

    readOperatorOrSymbol() {
        const start = this.location();
        for (const op of MULTI_CHAR_OPERATORS) {
            if (this.input.startsWith(op, this.pos)) {
                this.advance(op.length);
                return { type: op === '...' ? TokenType.SYMBOL : TokenType.OPERATOR, value: op, raw: op, start };
            }
        }
        const c = this.peek();
        this.advance();
        const operators = new Set(['+', '-', '*', '/', '%', '^', '#', '~', '<', '>', '=', '&', '|']);
        return { type: operators.has(c) ? TokenType.OPERATOR : TokenType.SYMBOL, value: c, raw: c, start };
    }

    tokenize() {
        const tokens = [];
        while (this.pos < this.input.length) {
            const c = this.peek();
            if (/\s/u.test(c)) {
                this.advance();
                continue;
            }

            if (c === '-' && this.peek(1) === '-') {
                const start = this.location();
                this.advance(2);
                const long = this.readLongBracket(this.pos);
                if (long !== null) continue;
                while (this.pos < this.input.length && this.peek() !== '\n') this.advance();
                tokens.push({ type: TokenType.SYMBOL, value: ';', raw: '', start, comment: true });
                continue;
            }

            if (c === '[') {
                const long = this.readLongBracket(this.pos);
                if (long !== null) {
                    tokens.push({ type: TokenType.STRING, value: long, raw: long, start: this.location() });
                    continue;
                }
            }

            if (c === '"' || c === "'") {
                tokens.push(this.readString());
                continue;
            }

            if (/\d/u.test(c) || (c === '.' && /\d/u.test(this.peek(1)))) {
                tokens.push(this.readNumber());
                continue;
            }

            const identifier = this.readIdentifier();
            if (identifier) {
                tokens.push(identifier);
                continue;
            }

            tokens.push(this.readOperatorOrSymbol());
        }
        tokens.push({ type: TokenType.EOF, value: null, raw: '', start: this.location() });
        return tokens.filter(token => !token.comment);
    }
}

module.exports = Tokenizer;
