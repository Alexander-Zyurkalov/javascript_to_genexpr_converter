const acorn = require('acorn');
const walk = require('acorn-walk');

// Sample input JavaScript code
const input = `
function hello(name) {
    console.log("Hello, " + name + "!");
    return name;
}
`;

// Parse the code into an AST
const ast = acorn.parse(input, {
    ecmaVersion: 2020,
    sourceType: 'module'
});

// Create a GenExpr-style output
let output = '';
const visitors = {
    FunctionDeclaration(node) {
        // Get function name
        const functionName = node.id.name;

        // Get parameters
        const params = node.params.map(param => param.name).join(', ');

        // Get function body by finding the original source between brackets
        const bodyStart = node.body.start + 1; // +1 to skip opening brace
        const bodyEnd = node.body.end - 1; // -1 to skip closing brace
        const body = input.slice(bodyStart, bodyEnd);

        // Generate GenExpr-style function
        output += `${functionName}(${params}) {${body}}\n`;
    }
};

// Walk the AST and transform nodes
walk.recursive(ast, {}, visitors);

console.log("Original JavaScript:");
console.log(input);
console.log("\nTransformed to GenExpr-style:");
console.log(output);

// Example of how to handle more node types
function handleNode(node) {
    switch(node.type) {
        case 'FunctionDeclaration':
            return handleFunctionDeclaration(node);
        case 'VariableDeclaration':
            return handleVariableDeclaration(node);
        case 'ExpressionStatement':
            return handleExpression(node);
        // Add more cases as needed
        default:
            console.log(`Unhandled node type: ${node.type}`);
            return '';
    }
}

// Helper functions for different node types
function handleFunctionDeclaration(node) {
    const name = node.id.name;
    const params = node.params.map(p => p.name).join(', ');
    const body = handleNode(node.body);
    return `${name}(${params}) {${body}}`;
}

function handleVariableDeclaration(node) {
    return node.declarations.map(decl => {
        const name = decl.id.name;
        const init = decl.init ? handleNode(decl.init) : '';
        return `let ${name} = ${init};`;
    }).join('\n');
}

function handleExpression(node) {
    if (node.expression.type === 'CallExpression') {
        const callee = handleNode(node.expression.callee);
        const args = node.expression.arguments.map(handleNode).join(', ');
        return `${callee}(${args});`;
    }
    return '';
}
