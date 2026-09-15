class ASTNode {
    constructor(type, props = {}) {
        this.type = type;
        Object.assign(this, props);
    }
}

function node(type, props) {
    return new ASTNode(type, props);
}

module.exports = ASTNode;
module.exports.node = node;
