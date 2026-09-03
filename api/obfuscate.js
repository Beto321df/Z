// Importación robusta de módulos (soporta module.exports = Clase o module.exports = { Clase })
let Tokenizer = require('../src/lexer/tokenizer');
Tokenizer = Tokenizer.Tokenizer || Tokenizer.default || Tokenizer;

let Parser = require('../src/parser/parser');
Parser = Parser.Parser || Parser.default || Parser;

let StringEncoderTransform = require('../src/transforms/stringEncoder');
StringEncoderTransform = StringEncoderTransform.StringEncoderTransform || StringEncoderTransform.default || StringEncoderTransform;

let DeadCodeTransform = require('../src/transforms/deadCode');
DeadCodeTransform = DeadCodeTransform.DeadCodeTransform || DeadCodeTransform.default || DeadCodeTransform;

let VMCompiler = require('../src/vm/compiler');
VMCompiler = VMCompiler.VMCompiler || VMCompiler.default || VMCompiler;

let VMInterpreterGenerator = require('../src/vm/interpreter');
VMInterpreterGenerator = VMInterpreterGenerator.VMInterpreterGenerator || VMInterpreterGenerator.default || VMInterpreterGenerator;

let CodeGenerator = require('../src/generator/codegen');
CodeGenerator = CodeGenerator.CodeGenerator || CodeGenerator.default || CodeGenerator;

module.exports = async (req, res) => {
    // Encabezados CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        let code = null;
        if (req.body) {
            if (typeof req.body === 'string') {
                try {
                    const parsed = JSON.parse(req.body);
                    code = parsed.code;
                } catch (e) {
                    code = req.body;
                }
            } else if (typeof req.body === 'object') {
                code = req.body.code;
            }
        }

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Código no proporcionado o formato inválido' });
        }

        // Pipeline del Ofuscador
        const tokenizer = new Tokenizer(code);
        const tokens = tokenizer.tokenize();

        const parser = new Parser(tokens);
        const ast = parser.parse();

        const stringTable = new Map();
        const stringEncoder = new StringEncoderTransform();
        stringEncoder.transformNode(ast, stringTable);

        const deadCode = new DeadCodeTransform();
        if (ast.body) {
            ast.body = deadCode.inject(ast.body);
        }

        const compiler = new VMCompiler();
        const bytecode = compiler.compile(ast);

        const interpreterGen = new VMInterpreterGenerator();
        const vmCode = interpreterGen.generate(bytecode, stringTable);

        const generator = new CodeGenerator();
        const obfuscatedCode = generator.generate(vmCode);

        return res.status(200).json({
            success: true,
            obfuscatedCode: obfuscatedCode
        });
    } catch (err) {
        console.error('Error durante la ofuscación:', err);
        return res.status(500).json({
            error: 'Error interno en el motor de ofuscación',
            details: err.message
        });
    }
};
