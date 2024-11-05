import { JsToGenExprConverter } from '../converter';

describe('JsToGenExprConverter', () => {
    let converter: JsToGenExprConverter;

    beforeEach(() => {
        converter = new JsToGenExprConverter();
    });

    it('should convert simple function declaration to GenExpr syntax', () => {
        const input = `
function add(x, y) {
    return x + y;
}`;
        const expected = `
add(x, y) {
    return x + y;
}`;
        expect(converter.convert(input)).toBe(expected);
    });

    it('should handle multiple function declarations', () => {
        const input = `
function first(x) {
    return x * 2;
}

function second(y) {
    return y + 1;
}`;
        const expected = `
first(x) {
    return x * 2;
}

second(y) {
    return y + 1;
}`;
        expect(converter.convert(input)).toBe(expected);
    });

    it('should preserve non-function code', () => {
        const input = `
const a = 5;
function test(x) {
    return x * a;
}
let b = 10;`;
        const expected = `
const a = 5;
test(x) {
    return x * a;
}
let b = 10;`;
        expect(converter.convert(input)).toBe(expected);
    });

    it('should handle empty functions', () => {
        const input = `function empty() {}`;
        const expected = `empty() {}`;
        expect(converter.convert(input)).toBe(expected);
    });

    it('should handle functions with no parameters', () => {
        const input = `
function noParams() {
    return 42;
}`;
        const expected = `
noParams() {
    return 42;
}`;
        expect(converter.convert(input).trim()).toBe(expected.trim());
    });

    it('should preserve whitespace and formatting within function body', () => {
        const input = `
function formatted(x) {
    const result = x * 2;
    
    // Some comment
    return result;
}`;
        const expected = `
formatted(x) {
    const result = x * 2;
    
    // Some comment
    return result;
}`;
        expect(converter.convert(input)).toBe(expected);
    });
});

describe('return statement handling', () => {
    let converter: JsToGenExprConverter;

    beforeEach(() => {
        converter = new JsToGenExprConverter();
    });

    it('should preserve single value returns', () => {
        const input = `
function test(x) {
    return x + 1;
}`;
        const expected = `
test(x) {
    return x + 1;
}`;
        expect(converter.convert(input)).toBe(expected);
    });

    it('should convert array returns to multiple values', () => {
        const input = `
function polarToCart(r, theta) {
    return [r * Math.cos(theta), r * Math.sin(theta)];
}`;
        const expected = `
polarToCart(r, theta) {
    return r * Math.cos(theta), r * Math.sin(theta);
}`;
        expect(converter.convert(input)).toBe(expected);
    });

    it('should handle array returns with complex expressions', () => {
        const input = `
function complexCalc(x, y) {
    return [x * 2 + y, x - y * 3, (x + y) / 2];
}`;
        const expected = `
complexCalc(x, y) {
    return x * 2 + y, x - y * 3, (x + y) / 2;
}`;
        expect(converter.convert(input)).toBe(expected);
    });

    it('should preserve non-array returns', () => {
        const input = `
function getValue() {
    const arr = [1, 2, 3];
    return arr[0];
}`;
        const expected = `
getValue() {
    const arr = [1, 2, 3];
    return arr[0];
}`;
        expect(converter.convert(input)).toBe(expected);
    });

    it('should handle functions with multiple return statements', () => {
        const input = `
function test(x, y) {
    if (x < 0) {
        return [x, y];
    }
    return [x * 2, y * 2];
}`;
        const expected = `
test(x, y) {
    if (x < 0) {
        return x, y;
    }
    return x * 2, y * 2;
}`;
        expect(converter.convert(input)).toBe(expected);
    });
});
