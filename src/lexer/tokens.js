const TokenType = {
    KEYWORD: 'KEYWORD',
    IDENTIFIER: 'IDENTIFIER',
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    SYMBOL: 'SYMBOL',
    EOF: 'EOF'
};

const LUAU_KEYWORDS = new Set([
    'and', 'break', 'do', 'else', 'elseif', 'end', 'false',
    'for', 'function', 'if', 'in', 'local', 'nil', 'not',
    'or', 'repeat', 'return', 'then', 'true', 'until', 'while',
    'type', 'export', 'continue'
]);

module.exports = { TokenType, LUAU_KEYWORDS };
