import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

type Replacement = {
    start: number;
    end: number;
    text: string;
};

interface FunctionInfo {
    name: string;
    params: string[];
    defaultParams: Map<string, string>;
    body: string;
    isMain: boolean;
}

export class JsToGenExprConverter {
    // Keep existing convert method for backwards compatibility
    public convert(code: string): string {
        return this.processBasicConversion(code);
    }

    public convertToGenExpr(code: string): string {
        const functions = this.parseFunctions(code);
        if (!functions.length) return '';

        const mainFunction = functions.find(f => f.name === 'main');
        const otherFunctions = functions.filter(f => f.name !== 'main');

        let output = '';

        // First output other functions
        for (const func of otherFunctions) {
            output += this.convertFunction(func) + '\n\n';
        }

        // Then process main function if it exists
        if (mainFunction) {
            output += this.processMainFunction(mainFunction);
        }

        return output.trim();
    }

    private processBasicConversion(code: string): string {
        const ast = acorn.parse(code, {
            ecmaVersion: 2020,
            sourceType: 'module'
        });

        const replacements: Array<Replacement> = [];

        walk.simple(ast, {
            FunctionDeclaration: (node: any) => {
                const functionName = node.id.name;
                const params = node.params.map((param: any) =>
                    param.type === 'AssignmentPattern'
                        ? `${param.left.name}=${this.getNodeValue(param.right)}`
                        : param.name
                ).join(', ');

                const originalBody = code.slice(node.body.start + 1, node.body.end - 1);
                const processedBody = this.processReturnStatements(originalBody);

                const genExprFunction = `${functionName}(${params}) {${processedBody}}`;

                replacements.push({
                    start: node.start,
                    end: node.end,
                    text: genExprFunction
                });
            }
        });

        let result = code;
        for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
            result = result.slice(0, replacement.start) +
                replacement.text +
                result.slice(replacement.end);
        }

        return result;
    }

    private parseFunctions(code: string): FunctionInfo[] {
        const functions: FunctionInfo[] = [];
        const ast = acorn.parse(code, { ecmaVersion: 2020 });

        walk.simple(ast, {
            FunctionDeclaration: (node: any) => {
                const name = node.id.name;
                const params: string[] = [];
                const defaultParams = new Map<string, string>();

                node.params.forEach((param: any) => {
                    if (param.type === 'AssignmentPattern') {
                        params.push(param.left.name);
                        defaultParams.set(param.left.name, this.getNodeValue(param.right));
                    } else {
                        params.push(param.name);
                    }
                });

                const body = code.slice(node.body.start + 1, node.body.end - 1);

                functions.push({
                    name,
                    params,
                    defaultParams,
                    body: this.processBody(body),
                    isMain: name === 'main'
                });
            }
        });

        return functions;
    }

    private processBody(body: string): string {
        // Remove let and var declarations
        return body.replace(/\b(let|var)\s+/g, '');
    }

    private getNodeValue(node: any): string {
        if (node.type === 'Literal') {
            return node.value.toString();
        }
        // Add more node types as needed
        return '';
    }

    private convertFunction(func: FunctionInfo): string {
        const params = func.params.map(param =>
            func.defaultParams.has(param)
                ? `${param}=${func.defaultParams.get(param)}`
                : param
        ).join(', ');

        return `${func.name}(${params}) {${func.body}}`;
    }

    private processMainFunction(main: FunctionInfo): string {
        let output = '';

        // Add Param declarations for default parameters
        main.defaultParams.forEach((value, name) => {
            output += `Param ${name}(${value});\n`;
        });

        // Map inputs to variables
        main.params.forEach((param, index) => {
            if (!main.defaultParams.has(param)) {
                output += `${param} = in${index + 1};\n`;
            }
        });

        output += '\n';

        // Process function body
        const bodyAst = acorn.parse(`function wrapper() {${main.body}}`, {
            ecmaVersion: 2020,
            locations: true
        });

        // Get all statements before return
        const functionBody = (bodyAst as any).body[0].body;
        const statements = functionBody.body;
        let processedStatements = [];

        // Process all statements except return
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            if (stmt.type === 'ReturnStatement') continue;

            if (stmt.type === 'VariableDeclaration') {
                for (const decl of stmt.declarations) {
                    const initCode = main.body.slice(
                        decl.init.start - 'function wrapper() {'.length,
                        decl.init.end - 'function wrapper() {'.length
                    ).trim();
                    processedStatements.push(`${decl.id.name} = ${initCode};`);
                }
            } else if (stmt.type === 'ExpressionStatement') {
                const exprCode = main.body.slice(
                    stmt.start - 'function wrapper() {'.length,
                    stmt.end - 'function wrapper() {'.length
                ).trim();
                if (exprCode.endsWith(';')) {
                    processedStatements.push(exprCode);
                } else {
                    processedStatements.push(`${exprCode};`);
                }
            }
        }

        // Add processed statements if there are any
        if (processedStatements.length > 0) {
            output += processedStatements.join('\n') + '\n';
        }

        // Process return statement
        const returnStmt = statements.find((stmt: { type: string; }) => stmt.type === 'ReturnStatement');
        if (returnStmt) {
            if (returnStmt.argument?.type === 'ArrayExpression') {
                returnStmt.argument.elements.forEach((elem: any, index: number) => {
                    const expr = main.body.slice(
                        elem.start - 'function wrapper() {'.length,
                        elem.end - 'function wrapper() {'.length
                    );
                    output += `out${index + 1} = ${expr};\n`;
                });
            } else if (returnStmt.argument) {
                const expr = main.body.slice(
                    returnStmt.argument.start - 'function wrapper() {'.length,
                    returnStmt.argument.end - 'function wrapper() {'.length
                );
                output += `out1 = ${expr};\n`;
            }
        }

        return output;
    }
    private processReturnStatements(bodyText: string): string {
        try {
            const wrappedCode = `function wrapper() {${bodyText}}`;
            const bodyAst = acorn.parse(wrappedCode, {
                ecmaVersion: 2020,
                sourceType: 'script'
            });

            const replacements: Array<Replacement> = [];

            walk.simple(bodyAst, {
                ReturnStatement: (node: any) => {
                    if (node.argument?.type === 'ArrayExpression') {
                        const elements = node.argument.elements.map((elem: any) =>
                            bodyText.slice(
                                elem.start - 'function wrapper() {'.length,
                                elem.end - 'function wrapper() {'.length
                            )
                        ).join(', ');

                        const originalText = bodyText.slice(
                            node.start - 'function wrapper() {'.length,
                            node.end - 'function wrapper() {'.length
                        );
                        const hasSemicolon = originalText.endsWith(';');

                        replacements.push({
                            start: node.start - 'function wrapper() {'.length,
                            end: node.end - 'function wrapper() {'.length,
                            text: `return ${elements}${hasSemicolon ? ';' : ''}`
                        });
                    }
                }
            });

            let result = bodyText;
            for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
                result = result.slice(0, replacement.start) +
                    replacement.text +
                    result.slice(replacement.end);
            }

            return result;
        } catch (e) {
            console.warn('Failed to parse function body:', e);
            return bodyText;
        }
    }
}
