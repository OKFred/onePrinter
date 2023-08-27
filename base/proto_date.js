/**
 * @author Fred
 * @desc 日期(Date)原型扩展(maybe not a best practice)
 * @since 2023-02-22 18:27:00
 */

/**
 * @desc 时间差计算
 * @return {string} result - 计算结果
 */
Date.prototype.Delta = function () {
    /* 计算日期差 */
    let time = this.valueOf();
    let now = new Date().valueOf();
    let delta = now - time == 0 ? 0 : (now - time) / 86400000;
    let result;
    if (delta > 0) {
        if (delta > 365.2426) {
            result = Math.floor(delta / 365.2426) + "年前";
        } else if (delta > 30.4167) {
            result = Math.floor(delta / 30.4167) + "个月前";
        } else if (delta > 1) {
            result = Math.floor(delta) + "天前";
        } else if (delta * 24 > 1) {
            result = Math.floor(delta * 24) + "小时前";
        } else if (delta * 24 * 60 > 1) {
            result = Math.floor(delta * 24 * 60) + "分钟前";
        } else {
            result = Math.floor(delta * 24 * 60 * 60) + "秒钟前";
        }
    } else if (delta === 0) {
        result = "刚刚";
    } else {
        if (delta < -365.2426) {
            result = Math.floor(Math.abs(delta / 365.2426)) + "年后";
        } else if (delta < -30.4167) {
            result = Math.floor(Math.abs(delta / 30.4167)) + "个月后";
        } else if (delta < -1) {
            result = Math.floor(Math.abs(delta)) + "天后";
        } else if (delta * 24 < -1) {
            result = Math.floor(Math.abs(delta * 24)) + "小时后";
        } else if (delta * 24 * 60 < -1) {
            result = Math.floor(Math.abs(delta * 24 * 60)) + "分钟后";
        } else {
            result = Math.floor(Math.abs(delta * 24 * 60 * 60)) + "秒钟后";
        }
    }
    return result;
};

/**
 * @desc 日期格式化
 * @param {string} fmt - 格式化模板
 * @return {string} fmt - 格式化结果
 * @example
 * let date = new Date();
 * date.Format("yyyy-MM-dd hh:mm:ss");
 * date.Format("yyyy-MM-dd 00:00:00");
 * date.Format("yyyy-MM-dd");
 * */
Date.prototype.Format = function (fmt) {
    /* 日期格式化模块 */
    let o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
    };
    if (/(y+)/i.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, this.getFullYear() + "");
    }
    for (let k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, ("00" + o[k]).substring(("" + o[k]).length));
        }
    }
    return fmt;
};

/**
 * @desc 日期格式化(带时区)
 * @return {string} result - 格式化结果
 * @example
 * let date = new Date();
 * date.zonedDateTime();
 * */
Date.prototype.zonedDateTime = function () {
    //日期带时区；比如：2021-10-13T14:39:43.612+08:00
    let timeDifferenceMilSec = -(this.getTimezoneOffset() * 60 * 1000);
    let sign = timeDifferenceMilSec >= 0 ? "+" : "-";
    let hour = Math.abs(Math.floor(timeDifferenceMilSec / 3600 / 1000));
    let min = Math.abs(this.getTimezoneOffset()) - hour * 60;
    if (/^\d{1}$/.test(hour)) hour = "0" + hour;
    if (/^\d{1}$/.test(min)) min = "0" + min;
    return new Date(this.valueOf() + timeDifferenceMilSec)
        .toJSON()
        .replace("Z", sign + hour + ":" + min);
};
