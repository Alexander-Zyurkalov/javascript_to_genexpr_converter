import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

export class JsToGenExprConverter {
    /**
     * Processes return statements in a function body, converting array returns to multiple values
     */
    private processReturnStatements(bodyText: string, functionBodyStart: number): Array<{
        start: number;
        end: number;
        text: string;
    }> {
        const replacements: Array<{
            start: number;
            end: number;
            text: string;
        }> = [];

        try {
            // Wrap the body text in a function to make it parseable
            const wrappedCode = `function wrapper() {${bodyText}}`;
            const bodyAst = acorn.parse(wrappedCode, {
                ecmaVersion: 2020,
                sourceType: 'script'
            });

            walk.simple(bodyAst, {
                ReturnStatement: (returnNode: any) => {
                    if (returnNode.argument?.type === 'ArrayExpression') {
                        const elements = returnNode.argument.elements.map((elem: any) =>
                            // Adjust slice indices to account for the wrapper function
                            bodyText.slice(
                                elem.start - 'function wrapper() {'.length,
                                elem.end - 'function wrapper() {'.length
                            )
                        ).join(', ');

                        replacements.push({
                            start: functionBodyStart + returnNode.start - 'function wrapper() {'.length,
                            end: functionBodyStart + returnNode.end - 'function wrapper() {'.length,
                            text: `return ${elements}`
                        });
                    }
                }
            });
        } catch (e) {
            console.warn('Failed to parse function body:', e);
        }

        return replacements;
    }

    public convert(code: string): string {
        const ast = acorn.parse(code, {
            ecmaVersion: 2020,
            sourceType: 'module'
        });

        const replacements: Array<{
            start: number;
            end: number;
            text: string;
        }> = [];

        walk.simple(ast, {
            FunctionDeclaration: (node: any) => {
                const functionName = node.id.name;
                const params = node.params.map((param: any) => param.name).join(', ');
                const bodyText = code.slice(node.body.start + 1, node.body.end - 1);

                // Process return statements in the function body
                const returnReplacements = this.processReturnStatements(
                    bodyText,
                    node.body.start + 1
                );
                replacements.push(...returnReplacements);

                // Create GenExpr style function
                const genExprFunction = `${functionName}(${params}) {${bodyText}}`;
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
