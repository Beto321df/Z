const TokenType = Object.freeze({
    KEYWORD: 'KEYWORD',
    IDENTIFIER: 'IDENTIFIER',
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    OPERATOR: 'OPERATOR',
    SYMBOL: 'SYMBOL',
    EOF: 'EOF'
});

const KEYWORDS = new Set([
    'and', 'break', 'continue', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
    'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until',
    'while', 'goto', 'export'
]);

const MULTI_CHAR_OPERATORS = Object.freeze([
    '..=', '...', '::', '==', '~=', '<=', '>=', '..', '//', '+=', '-=', '*=', '/=', '%='
]);

module.exports = { TokenType, KEYWORDS, MULTI_CHAR_OPERATORS };
