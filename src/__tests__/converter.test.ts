import { JsToGenExprConverter } from '../converter';

describe('JsToGenExprConverter', () => {
    let converter: JsToGenExprConverter;

    beforeEach(() => {
        converter = new JsToGenExprConverter();
    });

    describe('basic function conversion', () => {
        it('should convert simple function declaration to GenExpr syntax', () => {
            const input = `function add(x, y) { return x + y; }`;
            const expected = `add(x, y) { return x + y; }`;
            expect(converter.convert(input)).toBe(expected);
        });

        it('should handle multiple function declarations', () => {
            const input = `
        function first(x) { return x * 2; }
        function second(y) { return y + 1; }
      `;
            const expected = `
        first(x) { return x * 2; }
        second(y) { return y + 1; }
      `;
            expect(converter.convert(input)).toBe(expected);
        });

        it('should preserve non-function code', () => {
            const input = `const a = 5; function test(x) { return x * a; } let b = 10;`;
            const expected = `const a = 5; test(x) { return x * a; } let b = 10;`;
            expect(converter.convert(input)).toBe(expected);
        });
    });

    describe('return statement conversion', () => {
        it('should convert array returns to multiple values', () => {
            const input = `function polarToCart(r, theta) { return [r * Math.cos(theta), r * Math.sin(theta)]; }`;
            const expected = `polarToCart(r, theta) { return r * Math.cos(theta), r * Math.sin(theta); }`;
            expect(converter.convert(input)).toBe(expected);
        });

        it('should handle array returns with complex expressions', () => {
            const input = `function complexCalc(x, y) { return [x * 2 + y, x - y * 3, (x + y) / 2]; }`;
            const expected = `complexCalc(x, y) { return x * 2 + y, x - y * 3, (x + y) / 2; }`;
            expect(converter.convert(input)).toBe(expected);
        });

        it('should handle multiple return statements', () => {
            const input = `function test(x, y) { if (x < 0) { return [x, y]; } return [x * 2, y * 2]; }`;
            const expected = `test(x, y) { if (x < 0) { return x, y; } return x * 2, y * 2; }`;
            expect(converter.convert(input)).toBe(expected);
        });
    });

    describe('complex function bodies', () => {
        it('should preserve code before array return', () => {
            const input = `function process(x, y) { 
                const sum = x + y;
                const diff = x - y;
                console.log('Processing...');
                return [sum, diff]; 
            }`;
            const expected = `process(x, y) { 
                const sum = x + y;
                const diff = x - y;
                console.log('Processing...');
                return sum, diff; 
            }`;
            expect(converter.convert(input)).toBe(expected);
        });

        it('should preserve code after array return in conditional blocks', () => {
            const input = `function analyze(data) {
                if (data.length === 0) {
                    console.log('Empty data');
                    return [0, 0];
                }
                const result = process(data);
                return [result.mean, result.stddev];
            }`;
            const expected = `analyze(data) {
                if (data.length === 0) {
                    console.log('Empty data');
                    return 0, 0;
                }
                const result = process(data);
                return result.mean, result.stddev;
            }`;
            expect(converter.convert(input)).toBe(expected);
        });

        it('should handle array returns with surrounding loop code', () => {
            const input = `function calculatePairs(arr) {
                let results = [];
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i] < 0) {
                        return [arr[i], i];
                    }
                    results.push(arr[i] * 2);
                }
                return [results[0], results[1]];
            }`;
            const expected = `calculatePairs(arr) {
                let results = [];
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i] < 0) {
                        return arr[i], i;
                    }
                    results.push(arr[i] * 2);
                }
                return results[0], results[1];
            }`;
            expect(converter.convert(input)).toBe(expected);
        });

        it('should handle array returns with try-catch blocks', () => {
            const input = `function safeDivide(x, y) {
                try {
                    if (y === 0) {
                        throw new Error('Division by zero');
                    }
                    const result = x / y;
                    return [result, true];
                } catch (error) {
                    console.error(error);
                    return [0, false];
                }
            }`;
            const expected = `safeDivide(x, y) {
                try {
                    if (y === 0) {
                        throw new Error('Division by zero');
                    }
                    const result = x / y;
                    return result, true;
                } catch (error) {
                    console.error(error);
                    return 0, false;
                }
            }`;
            expect(converter.convert(input)).toBe(expected);
        });
    });

    describe('convertToGenExpr', () => {
        it('should convert basic functions with main function', () => {
            const input = `
                function add(x, y) { return x + y; }
                function main(a, b) { return [add(a, b), a * b]; }
            `;
            const expected =
                `add(x, y) { return x + y; }

a = in1;
b = in2;

out1 = add(a, b);
out2 = a * b;`;
            expect(converter.convertToGenExpr(input).trim()).toBe(expected.trim());
        });

        it('should handle default parameters', () => {
            const input = `
                function multiply(a, b=2) { return a * b; }
                function main(x, y=3) { return multiply(x, y); }
            `;
            const expected =
                `multiply(a, b=2) { return a * b; }

Param y(3);
x = in1;

out1 = multiply(x, y);`;
            expect(converter.convertToGenExpr(input).trim()).toBe(expected.trim());
        });

        it('should remove let/var declarations', () => {
            const input = `
                function process(a) {
                    let x = a * 2;
                    var y = x + 1;
                    return x + y;
                }
                function main(input) {
                    let result = process(input);
                    return [result, input];
                }
            `;
            const expected =
                `process(a) {
                    x = a * 2;
                    y = x + 1;
                    return x + y;
                }

input = in1;

result = process(input);
out1 = result;
out2 = input;`;
            expect(converter.convertToGenExpr(input).trim()).toBe(expected.trim());
        });

        it('should handle complex return expressions', () => {
            const input = `
                function calc(x, y) { return x * y + 1; }
                function main(a, b, c=5) {
                    let d = c * a * b;
                    return [calc(a, b), d, a + b + c];
                }
            `;
            const expected =
                `calc(x, y) { return x * y + 1; }

Param c(5);
a = in1;
b = in2;

d = c * a * b;
out1 = calc(a, b);
out2 = d;
out3 = a + b + c;`;
            expect(converter.convertToGenExpr(input).trim()).toBe(expected.trim());
        });

        it('should handle single return value', () => {
            const input = `
                function main(x) {
                    return x * 2;
                }
            `;
            const expected =
                `x = in1;

out1 = x * 2;`;
            expect(converter.convertToGenExpr(input).trim()).toBe(expected.trim());
        });
    });
});
