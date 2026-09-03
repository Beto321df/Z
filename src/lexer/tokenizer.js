import { TokenType, Token } from './tokens.js';

export class Tokenizer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;
  }

  peek() {
    return this.position < this.input.length ? this.input[this.position] : null;
  }

  advance() {
    const char = this.peek();
    this.position++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  tokenize() {
    const tokens = [];

    while (this.position < this.input.length) {
      const char = this.peek();

      // Ignorar espacios en blanco y saltos de línea
      if (/\s/.test(char)) {
        this.advance();
        continue;
      }

      const startLine = this.line;
      const startCol = this.column;

      // Números (enteros y decimales)
      if (/[0-9]/.test(char)) {
        let value = '';
        while (this.peek() && /[0-9.]/.test(this.peek())) {
          value += this.advance();
        }
        tokens.push(new Token(TokenType.NUMBER, value, startLine, startCol));
        continue;
      }

      // Identificadores y palabras clave
      if (/[a-zA-Z_]/.test(char)) {
        let value = '';
        while (this.peek() && /[a-zA-Z0-9_]/.test(this.peek())) {
          value += this.advance();
        }
        tokens.push(new Token(TokenType.IDENTIFIER, value, startLine, startCol));
        continue;
      }

      // Cadenas de texto ("ejemplo")
      if (char === '"' || char === "'") {
        const quote = this.advance();
        let value = '';
        while (this.peek() && this.peek() !== quote) {
          value += this.advance();
        }
        this.advance(); // Consumir comilla de cierre
        tokens.push(new Token(TokenType.STRING, value, startLine, startCol));
        continue;
      }

      // Operadores y símbolos individuales
      switch (char) {
        case '=':
          tokens.push(new Token(TokenType.ASSIGN, this.advance(), startLine, startCol));
          break;
        case '+':
          tokens.push(new Token(TokenType.PLUS, this.advance(), startLine, startCol));
          break;
        case '-':
          tokens.push(new Token(TokenType.MINUS, this.advance(), startLine, startCol));
          break;
        case '*':
          tokens.push(new Token(TokenType.STAR, this.advance(), startLine, startCol));
          break;
        case '/':
          tokens.push(new Token(TokenType.SLASH, this.advance(), startLine, startCol));
          break;
        case '(':
          tokens.push(new Token(TokenType.LPAREN, this.advance(), startLine, startCol));
          break;
        case ')':
          tokens.push(new Token(TokenType.RPAREN, this.advance(), startLine, startCol));
          break;
        case '{':
          tokens.push(new Token(TokenType.LBRACE, this.advance(), startLine, startCol));
          break;
        case '}':
          tokens.push(new Token(TokenType.RBRACE, this.advance(), startLine, startCol));
          break;
        case ';':
          tokens.push(new Token(TokenType.SEMICOLON, this.advance(), startLine, startCol));
          break;
        default:
          tokens.push(new Token(TokenType.UNKNOWN, this.advance(), startLine, startCol));
          break;
      }
    }

    tokens.push(new Token(TokenType.EOF, '', this.line, this.column));
    return tokens;
  }
}
