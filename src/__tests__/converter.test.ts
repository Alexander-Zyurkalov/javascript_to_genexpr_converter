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
});
