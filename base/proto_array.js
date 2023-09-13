/**
 * @author Fred
 * @desc 数组(Array)原型扩展(maybe not a best practice)
 * @since 2023-02-22 18:27:00
 */

/**
 * @desc 数组计算（加减乘除）
 * @param {string} operator - 运算符
 * @return {number} result - 计算结果
 * @example
 * let arr = [0.1, 0.2];
 * arr.calc("+"); // 0.3
 */
Array.prototype.calc = function (operator) {
    let arr = this;
    if (arr.length < 2) return undefined;
    let fn =
        operator === "+"
            ? add
            : operator === "-"
            ? subtract
            : operator === "*"
            ? multiply
            : operator === "/"
            ? divide
            : console.log;
    let result = arr[0];
    for (let i = 1; i < arr.length; i++) {
        let num = Number(arr[i]);
        result = fn(result, num);
        if (!numberCheck(result)) return undefined;
    } //取出第一个值，遍历数组，依次计算
    result = safeNumber(result);
    return result;
};

function add(x, y) {
    return x + y;
}
function subtract(x, y) {
    return x - y;
}
function multiply(x, y) {
    return x * y;
}
function divide(x, y) {
    return x / y;
}

function numberCheck(num) {
    return !isNaN(Number(num));
}
function safeNumber(num) {
    return Number(Number(num).toPrecision(15));
}
