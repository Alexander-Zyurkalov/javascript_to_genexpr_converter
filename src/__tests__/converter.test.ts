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
});
