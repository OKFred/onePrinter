/**
 * @author Fred
 * @desc 字符串(String)原型扩展(maybe not a best practice)
 * @since 2023-02-22 18:27:00
 */

/**
 * @desc 判断字符串是否为空
 * @return {boolean} result - 判断结果
 * @example
 * let str = "";
 * str.isNull(); // true
 * */
String.prototype.isNull = function () {
    let value = this;
    return (
        value === undefined ||
        value === "undefined" ||
        value === null ||
        value === "null" ||
        value === ""
    );
};

/**
 * @desc 单词首字母大写(空格分隔)
 * @return {string} result - 转换结果
 * @example
 * let str = "hello world";
 * str.firstUpperCase(); // "Hello World"
 */
String.prototype.firstUpperCase = function () {
    let arr = this.split(" ");
    let upperWords = [];
    arr.forEach((str) => {
        upperWords.push(str.charAt(0).toUpperCase() + str.slice(1));
    });
    let result = upperWords.join(" ");
    return result;
};

/**
 * @desc 字符串转换为blob对象
 * @return {blob} blob - 转换结果
 * @example
 * let str = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABA";
 * str.dataURItoBlob(); // blob
 * */
String.prototype.dataURItoBlob = function () {
    let dataURI = this.toString();
    let byteString = atob(dataURI.split(",")[1]);
    let mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    let ab = new ArrayBuffer(byteString.length);
    let ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    let blob = new Blob([ab], { type: mimeString });
    return blob;
};

/**
 * @desc 邮箱地址验证
 * @return {boolean} result - 验证结果
 * @example
 * let str = 'test@abstract.com';
 * str.validateEmail(); // true
 * */
String.prototype.validateEmail = function () {
    let email = this.toString();
    let re =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};

/**
 * @desc 转换非ASCII字符为转义字符
 * @return {string} result - 转换结果
 * @example
 * let str = 'hi 你好';
 * str.encodeNonASCII(); // "hi %E4%BD%A0%E5%A5%BD=="
 * */
String.prototype.encodeNonASCII = function () {
    let arr = [...this];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].charCodeAt() > 255) arr[i] = encodeURI(arr[i]);
    }
    return arr.join("");
};

/**
 * @desc 解码HTML实体
 * @return {string} result - 转换结果
 * @example
 * let str = '&lt;div&gt;hello world&lt;/div&gt;';
 * str.decodeHTMLEntity(); // "<div>hello world</div>"
 * */
String.prototype.decodeHTMLEntity = function () {
    let text = this;
    let map = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#039;": "'",
    };
    return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, (m) => {
        return map[m];
    });
};

/**
 * @desc 编码HTML实体
 * @return {string} result - 转换结果
 * @example
 * let str = '<div>hello world</div>';
 * str.encodeHTMLEntity(); // "&lt;div&gt;hello world&lt;/div&gt;"
 * */
String.prototype.encodeHTMLEntity = function () {
    let text = this;
    let map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => {
        return map[m];
    });
};

/**
 * @desc 16进制转换为10进制
 * @return {number} result - 转换结果
 * @example
 * "0F".hexToDec(); // 15
 * */
String.prototype.hexToDec = function hexToDec() {
    let hex = this;
    let str = parseInt("0x" + hex).toString();
    let num = Number(str);
    if (isNaN(num)) return 0;
    return num;
};

/**
 * @desc 16进制转换为浮点数
 * @return {number} result - 转换结果
 * @example
 * "0x3f800000".hexToFloat(); // 1
 * */
String.prototype.hexToFloat = function hexToFloat() {
    let hex = this;
    let float = 0; //小数
    let sign; //正负
    let mantissa; //有效位
    let exp; //指数
    let dec = 0; //十进制
    let multi = 1;
    let result; //返回值
    if (/^0x/.exec(hex)) {
        dec = parseInt(hex, 16);
    } else {
        for (let i = hex.length - 1; i >= 0; i -= 1) {
            if (hex.charCodeAt(i) > 255) return console.log("Wrong string--非16进制");
            dec += hex.charCodeAt(i) * multi;
            multi *= 256;
        }
    }
    sign = dec >>> 31 ? -1 : 1;
    exp = ((dec >>> 23) & 0xff) - 127;
    mantissa = ((dec & 0x7fffff) + 0x800000).toString(2);
    for (let i = 0; i < mantissa.length; i += 1) {
        float += parseInt(mantissa[i]) ? Math.pow(2, exp) : 0;
        exp--;
    }
    result = float * sign;
    return result;
};

String.prototype.hexToASCII = function hexToASCII(str1 = this) {
    let hex = str1.toString();
    let str = "";
    for (let n = 0; n < hex.length; n += 2) {
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
}; //16进制 → ASCII
