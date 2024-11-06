import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

type Replacement = {
    start: number;
    end: number;
    text: string;
};

export class JsToGenExprConverter {
    private processReturnStatements(bodyText: string): string {
        try {
            const wrappedCode = `function wrapper() {${bodyText}}`;
            const bodyAst = acorn.parse(wrappedCode, {
                ecmaVersion: 2020,
                sourceType: 'script'
            });

            const replacements: Array<Replacement> = [];

            let returnStatement = (returnNode: any) => {
                if (returnNode.argument?.type === 'ArrayExpression') {
                    const elements = returnNode.argument.elements.map((elem: any) =>
                        bodyText.slice(
                            elem.start - 'function wrapper() {'.length,
                            elem.end - 'function wrapper() {'.length
                        )
                    ).join(', ');

                    // Check if the original return statement ended with a semicolon
                    const originalText = bodyText.slice(
                        returnNode.start - 'function wrapper() {'.length,
                        returnNode.end - 'function wrapper() {'.length
                    );
                    const hasSemicolon = originalText.endsWith(';');

                    replacements.push({
                        start: returnNode.start - 'function wrapper() {'.length,
                        end: returnNode.end - 'function wrapper() {'.length,
                        text: `return ${elements}${hasSemicolon ? ';' : ''}`
                    });
                }
            };
            walk.simple(bodyAst, {
                ReturnStatement: returnStatement
            });

            // Apply replacements in reverse order
            let result = bodyText;
            for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
                result =
                    result.slice(0, replacement.start) +
                    replacement.text +
                    result.slice(replacement.end);
            }

            return result;
        } catch (e) {
            console.warn('Failed to parse function body:', e);
            return bodyText;
        }
    }

    public convert(code: string): string {
        const ast = acorn.parse(code, {
            ecmaVersion: 2020,
            sourceType: 'module'
        });

        const replacements: Array<Replacement> = [];

        walk.simple(ast, {
            FunctionDeclaration: (node: any) => {
                const functionName = node.id.name;
                const params = node.params.map((param: any) => param.name).join(', ');

                // Get original body text and process return statements
                const originalBody = code.slice(node.body.start + 1, node.body.end - 1);
                const processedBody = this.processReturnStatements(originalBody);

                // Create GenExpr style function
                const genExprFunction = `${functionName}(${params}) {${processedBody}}`;

                replacements.push({
                    start: node.start,
                    end: node.end,
                    text: genExprFunction
                });
            }
        });

        // Apply replacements in reverse order
        let result = code;
        for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
            result =
                result.slice(0, replacement.start) +
                replacement.text +
                result.slice(replacement.end);
        }

        return result;
    }
}
