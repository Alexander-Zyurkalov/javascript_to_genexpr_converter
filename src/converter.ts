import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

export class JsToGenExprConverter {
    /**
     * Converts JavaScript function declarations to GenExpr syntax
     * @param code JavaScript source code
     * @returns Converted code with GenExpr function syntax
     */
    public convert(code: string): string {
        // Parse the JavaScript code into an AST
        const ast = acorn.parse(code, {
            ecmaVersion: 2020,
            sourceType: 'module'
        });

        // Track the replacements we need to make
        const replacements: Array<{
            start: number;
            end: number;
            text: string;
        }> = [];

        // Walk the AST and collect function declarations
        walk.simple(ast, {
            FunctionDeclaration: (node: any) => {
                // Get function name
                const functionName = node.id.name;

                // Get parameters
                const params = node.params.map((param: any) => param.name).join(', ');

                // Find and process return statements in the function body
                let bodyText = code.slice(node.body.start + 1, node.body.end - 1);

                // Parse the function body to find return statements
                try {
                    const bodyAst = acorn.parse(bodyText, {
                        ecmaVersion: 2020,
                        sourceType: 'script'
                    });

                    walk.simple(bodyAst, {
                        ReturnStatement: (returnNode: any) => {
                            if (returnNode.argument?.type === 'ArrayExpression') {
                                // Get the original return statement text
                                const originalReturn = code.slice(
                                    node.body.start + 1 + returnNode.start,
                                    node.body.start + 1 + returnNode.end
                                );

                                // Get array elements as string
                                const elements = returnNode.argument.elements.map((elem: any) =>
                                    code.slice(
                                        node.body.start + 1 + elem.start,
                                        node.body.start + 1 + elem.end
                                    )
                                ).join(', ');

                                // Create GenExpr multi-return
                                const genExprReturn = `return ${elements}`;

                                // Add to replacements
                                replacements.push({
                                    start: node.body.start + 1 + returnNode.start,
                                    end: node.body.start + 1 + returnNode.end,
                                    text: genExprReturn
                                });
                            }
                        }
                    });
                } catch (e) {
                    // If parsing body fails, continue with original body
                    console.warn('Failed to parse function body, skipping return statement conversion');
                }

                // Create GenExpr style function
                const genExprFunction = `${functionName}(${params}) {${bodyText}}`;

                // Store the replacement
                replacements.push({
                    start: node.start,
                    end: node.end,
                    text: genExprFunction
                });
            }
        });

        // Apply replacements in reverse order to not affect other replacement positions
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
