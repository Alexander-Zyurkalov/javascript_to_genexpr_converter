function function1(a, b, c=1) {
    let d = a + b + c;
    return function2(d,a,b);
}
function function2(a, b, c) {
    return a + b + c * 100;
}

function main(a ,b, c=5) {
    let d = c * a * b;
    return [function1(a, b, c), d];
}


let d = main(1,2);
console.log(d);

/*
should be converted to the following:

function1(a, b, c=1) {
    d = a + b + c;
    return function2(a, b);
}

function2(a,b,c) {
    return a + b + c * 100;
}

Param c(1);
a = in1;
b = in2;

d = c * a * b;
out1 = function1(a, b, c);
out2 = d;

 */
