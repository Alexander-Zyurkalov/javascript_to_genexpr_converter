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

                // Get function body content (excluding braces)
                const bodyStart = node.body.start + 1; // Skip opening brace
                const bodyEnd = node.body.end - 1;     // Skip closing brace
                const body = code.slice(bodyStart, bodyEnd);

                // Create GenExpr style function
                const genExprFunction = `${functionName}(${params}) {${body}}`;

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
