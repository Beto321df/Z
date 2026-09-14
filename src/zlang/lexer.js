const TOKEN_TYPES = {
    IDENT: 1,
    NUMBER: 2,
    STRING: 3,
    OPERATOR: 4,
    PUNCT: 5,
    WHITESPACE: 6,
    COMMENT: 7,
    OTHER: 8
};

function isAlpha(ch) {
    return !!ch && /[A-Za-z_]/.test(ch);
}

function isDigit(ch) {
    return !!ch && /[0-9]/.test(ch);
}

function isAlphaNum(ch) {
    return isAlpha(ch) || isDigit(ch);
}

function scanQuoted(source, start, quote) {
    let i = start + 1;
    while (i < source.length) {
        if (source[i] === '\\') {
            i += 2;
            continue;
        }
        if (source[i] === quote) return i + 1;
        i += 1;
    }
    return source.length;
}

function scanLongBracket(source, start) {
    if (source[start] !== '[') return -1;
    let i = start + 1;
    let equals = 0;
    while (i < source.length && source[i] === '=') {
        equals += 1;
        i += 1;
    }
    if (source[i] !== '[') return -1;
    const close = ']' + '='.repeat(equals) + ']';
    const end = source.indexOf(close, i + 1);
    return end === -1 ? source.length : end + close.length;
}

function scanNumber(source, start) {
    let i = start;
    if (source[i] === '0' && (source[i + 1] === 'x' || source[i + 1] === 'X')) {
        i += 2;
        while (i < source.length && /[0-9A-Fa-f_]/.test(source[i])) i += 1;
        if (source[i] === '.') {
            i += 1;
            while (i < source.length && /[0-9A-Fa-f_]/.test(source[i])) i += 1;
        }
        return i;
    }

    while (i < source.length && /[0-9_]/.test(source[i])) i += 1;
    if (source[i] === '.') {
        i += 1;
        while (i < source.length && /[0-9_]/.test(source[i])) i += 1;
    }
    if (source[i] === 'e' || source[i] === 'E') {
        i += 1;
        if (source[i] === '+' || source[i] === '-') i += 1;
        while (i < source.length && /[0-9_]/.test(source[i])) i += 1;
    }
    return i;
}

function readToken(source, start) {
    const ch = source[start];
    const next = source[start + 1];

    if (/[ \t\r\n]/.test(ch)) {
        let i = start + 1;
        while (i < source.length && /[ \t\r\n]/.test(source[i])) i += 1;
        return { type: TOKEN_TYPES.WHITESPACE, text: source.slice(start, i), next: i };
    }

    if (ch === '-' && next === '-') {
        const longEnd = scanLongBracket(source, start + 2);
        if (longEnd !== -1) return { type: TOKEN_TYPES.COMMENT, text: source.slice(start, longEnd), next: longEnd };
        const end = source.indexOf('\n', start + 2);
        const i = end === -1 ? source.length : end;
        return { type: TOKEN_TYPES.COMMENT, text: source.slice(start, i), next: i };
    }

    if (ch === '"' || ch === "'") {
        const i = scanQuoted(source, start, ch);
        return { type: TOKEN_TYPES.STRING, text: source.slice(start, i), next: i };
    }

    const longEnd = ch === '[' ? scanLongBracket(source, start) : -1;
    if (longEnd !== -1) return { type: TOKEN_TYPES.STRING, text: source.slice(start, longEnd), next: longEnd };

    if (isAlpha(ch)) {
        let i = start + 1;
        while (i < source.length && isAlphaNum(source[i])) i += 1;
        return { type: TOKEN_TYPES.IDENT, text: source.slice(start, i), next: i };
    }

    if (isDigit(ch) || (ch === '.' && isDigit(next))) {
        const i = scanNumber(source, start);
        return { type: TOKEN_TYPES.NUMBER, text: source.slice(start, i), next: i };
    }

    const operators = [
        '...', '::', '->', '=>', '==', '~=', '<=', '>=', '..', '+=', '-=', '*=', '/=', '%=', '^=', '&&', '||', '<<', '>>', '//'
    ];
    for (const op of operators) {
        if (source.startsWith(op, start)) return { type: TOKEN_TYPES.OPERATOR, text: op, next: start + op.length };
    }

    if ('+-*/%^#=<>~&|'.includes(ch)) return { type: TOKEN_TYPES.OPERATOR, text: ch, next: start + 1 };
    if ('(){}[];:,.'.includes(ch)) return { type: TOKEN_TYPES.PUNCT, text: ch, next: start + 1 };
    return { type: TOKEN_TYPES.OTHER, text: ch, next: start + 1 };
}

function tokenize(source) {
    if (typeof source !== 'string') throw new TypeError('Z lexer esperaba una cadena.');
    const tokens = [];
    let i = 0;
    while (i < source.length) {
        const token = readToken(source, i);
        if (!token || token.next <= i) throw new Error(`Z lexer atascado en ${i}.`);
        tokens.push({ type: token.type, text: token.text });
        i = token.next;
    }
    return tokens;
}

module.exports = { TOKEN_TYPES, tokenize };
