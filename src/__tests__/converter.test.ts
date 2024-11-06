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
            const input =
                `function first(x) { return x * 2; }` + `\n\n` +
                `function second(y) { return y + 1; }`;
            const expected =
                `first(x) { return x * 2; }` + `\n\n` +
                `second(y) { return y + 1; }`;
            expect(converter.convert(input)).toBe(expected);
        });

        it('should preserve non-function code', () => {
            const input =
                `function test(x) {const a = 5; return x * a; let b = 10;}`;
            const expected =
                `test(x) {a = 5; return x * a; b = 10;}`;
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
            const input = `function test(x, y) { if (x < 0) { return [x, y]; }; return [x * 2, y * 2]; }`;
            const expected = `test(x, y) { if (x < 0) { return x, y; }; return x * 2, y * 2; }`;
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
                sum = x + y;
                diff = x - y;
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
                result = process(data);
                return result.mean, result.stddev;
            }`;
            expect(converter.convert(input)).toBe(expected);
        });

        it('should handle array returns with surrounding loop code', () => {
            const input = `function calculatePairs(arr) {
                let results = 10;
                let test1 = 0;
                for (let i = 0; i < results; i++) {
                    if (func(i) < 0) {
                        return [func(i), i];
                    }
                    test1 = (test1 + func(i)) * 2;
                }
                return [results, test1];
            }`;
            const expected = `calculatePairs(arr) {
                results = 10;
                test1 = 0;
                for (i = 0; i < results; i++) {
                    if (func(i) < 0) {
                        return func(i), i;
                    }
                    test1 = (test1 + func(i)) * 2;
                }
                return results, test1;
            }`;
            expect(converter.convert(input)).toBe(expected);
        });
        ;
    });


        describe('more complex program with main function', () => {
            it('should convert basic functions', () => {
                const input =
                    `function add(x, y) { return x + y; }` + `\n` +
                    `function main(a, b) { return [add(a, b), a * b]; }`;
                const expected =
                    `add(x, y) { return x + y; }` + `\n` +
                    `\n` +
                    `a = in1;` + `\n` +
                    `b = in2;` + `\n` +
                    `\n` +
                    `out1 = add(a, b);` + `\n` +
                    `out2 = a * b;`;
                expect(converter.convert(input).trim()).toBe(expected);
            });

            it('should handle default parameters', () => {
                const input =
                    `function multiply(a, b=2) { return a * b; }` + `\n` +
                    `function main(x, y=3) { return multiply(x, y); }`;
                const expected =
                    `multiply(a, b=2) { return a * b; }` + `\n` +
                    `\n` +
                    `Param y(3);` + `\n` +
                    `x = in1;` + `\n` +
                    `\n` +
                    `out1 = multiply(x, y);`;
                expect(converter.convert(input).trim()).toBe(expected);
            });

            it('should remove let/var declarations', () => {
                const input =
                    `function process(a) {` + `\n` +
                    `    let x = a * 2;` + `\n` +
                    `    var y = x + 1;` + `\n` +
                    `    return x + y;` + `\n` +
                    `}` + `\n` +
                    `function main(input) {` + `\n` +
                    `    let result = process(input);` + `\n` +
                    `    return [result, input];` + `\n` +
                    `}`;
                const expected =
                    `process(a) {` + `\n` +
                    `    x = a * 2;` + `\n` +
                    `    y = x + 1;` + `\n` +
                    `    return x + y;` + `\n` +
                    `}` + `\n` +
                    `\n` +
                    `input = in1;` + `\n` +
                    `\n` +
                    `result = process(input);` + `\n` +
                    `out1 = result;` + `\n` +
                    `out2 = input;`;
                expect(converter.convert(input).trim()).toBe(expected);
            });

            it('should handle complex return expressions', () => {
                const input =
                    `function calc(x, y) { return x * y + 1; }` + `\n` +
                    `function main(a, b, c=5) {` + `\n` +
                    `    let d = c * a * b;` + `\n` +
                    `    return [calc(a, b), d, a + b + c];` + `\n` +
                    `}`;
                const expected =
                    `calc(x, y) { return x * y + 1; }` + `\n` +
                    `\n` +
                    `Param c(5);` + `\n` +
                    `a = in1;` + `\n` +
                    `b = in2;` + `\n` +
                    `\n` +
                    `d = c * a * b;` + `\n` +
                    `out1 = calc(a, b);` + `\n` +
                    `out2 = d;` + `\n` +
                    `out3 = a + b + c;`;
                expect(converter.convert(input).trim()).toBe(expected);
            });

            it('should handle single return value', () => {
                const input =
                    `function main(x) {` + `\n` +
                    `    return x * 2;` + `\n` +
                    `}`;
                const expected =
                    `x = in1;` + `\n` +
                    `\n` +
                    `out1 = x * 2;`;
                expect(converter.convert(input).trim()).toBe(expected);
            });

        it('should handle multiple functions with complex interactions', () => {
            const input =
                `function function1(a, b, c=1) {` + `\n` +
                `    let d = a + b + c;` + `\n` +
                `    return function2(d, a, b);` + `\n` +
                `}` + `\n` +
                `function function2(a, b, c) {` + `\n` +
                `    return a + b + c * 100;` + `\n` +
                `}` + `\n` +
                `function main(a, b, c=5) {` + `\n` +
                `    let d = c * a * b;` + `\n` +
                `    return [function1(a, b, c), d];` + `\n` +
                `}`;
            const expected =
                `function1(a, b, c=1) {` + `\n` +
                `    d = a + b + c;` + `\n` +
                `    return function2(d, a, b);` + `\n` +
                `}` + `\n` +
                `\n` +
                `function2(a, b, c) {` + `\n` +
                `    return a + b + c * 100;` + `\n` +
                `}` + `\n` +
                `\n` +
                `Param c(5);` + `\n` +
                `a = in1;` + `\n` +
                `b = in2;` + `\n` +
                `\n` +
                `d = c * a * b;` + `\n` +
                `out1 = function1(a, b, c);` + `\n` +
                `out2 = d;`;
            expect(converter.convert(input).trim()).toBe(expected);
        });
    });
});
