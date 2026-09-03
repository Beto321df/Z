class ASTNode {
    constructor(type) {
        this.type = type;
    }
}

class ChunkNode extends ASTNode {
    constructor(body = []) {
        super('Chunk');
        this.body = body;
    }
}

class LocalStatementNode extends ASTNode {
    constructor(names = [], init = []) {
        super('LocalStatement');
        this.names = names;
        this.init = init;
    }
}

class AssignmentStatementNode extends ASTNode {
    constructor(variables = [], init = []) {
        super('AssignmentStatement');
        this.variables = variables;
        this.init = init;
    }
}

class CallStatementNode extends ASTNode {
    constructor(expression) {
        super('CallStatement');
        this.expression = expression;
    }
}

class FunctionCallNode extends ASTNode {
    constructor(callee, args = []) {
        super('FunctionCall');
        this.callee = callee;
        this.args = args;
    }
}

class IdentifierNode extends ASTNode {
    constructor(name) {
        super('Identifier');
        this.name = name;
    }
}

class StringLiteralNode extends ASTNode {
    constructor(value) {
        super('StringLiteral');
        this.value = value;
    }
}

class NumberLiteralNode extends ASTNode {
    constructor(value) {
        super('NumberLiteral');
        this.value = value;
    }
}

module.exports = {
    ChunkNode,
    LocalStatementNode,
    AssignmentStatementNode,
    CallStatementNode,
    FunctionCallNode,
    IdentifierNode,
    StringLiteralNode,
    NumberLiteralNode
};
