/**
 * @author Fred
 * @desc 数字(Number)原型扩展(maybe not a best practice)
 * @since 2023-02-22 18:27:00
 */

/**
 * @desc 转换为货币格式(保留两位)
 * @return {string} result - 转换结果
 */
Number.prototype.toCurrency = function () {
    let thisNumber = Number(this);
    let result = thisNumber.toFixed(2);
    return result;
};

/**
 * @desc 转换为安全数字
 * @return {number} result - 转换结果
 * @example
 * let num = 0.1 + 0.2;
 * num.safeNumber(); // 0.3
 * */
Number.prototype.safeNumber = function safeNumber() {
    return Number(Number(this).toPrecision(15));
};
