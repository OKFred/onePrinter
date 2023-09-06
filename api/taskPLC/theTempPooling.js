// nodejs with s7 200 smart plc, using es module

import nodeSnap7 from "node-snap7";
import { onWriteQuery } from "./theTempSaver.js";

let freezerTaskToken = globalThis.envGetter("freezerTaskToken") || "";
let taskRegisterObj = {};

export { onNewTask, onEndTask, onGetAllTasks };

/**
 * 启动任务
 * @param {Object} obj
 * @param {String} obj.plcAddress PLC的IP地址
 * @param {Number} obj.rack 机架号
 * @param {Number} obj.slot 插槽号
 * @param {Number} obj.area 读取的区域
 * @param {Number} obj.dbNumber DB块号
 * @param {Number} obj.startByte 起始字节
 * @param {Number} obj.length 读取的长度
 * @param {Number} obj.wordLength 字长
 * @returns {Promise}
 * */
async function onNewTask(
    {
        plcAddress = "",
        rack = 0,
        slot = 0,
        area = 0x84,
        dbNumber = 1,
        startByte = 0,
        length = 4,
        wordLength = 0x04,
    } = {},
    callbacks,
) {
    [rack, slot, startByte] = [rack, slot, startByte].map((item) => Number(item));
    if (
        [rack, slot, startByte].some((item) => isNaN(item)) ||
        !plcAddress ||
        !rack ||
        !slot ||
        !startByte
    ) {
        callbacks?.({
            success: false,
            data: null,
            message: "参数错误",
        });
        return;
    }
    let client = await startClient({ plcAddress, rack, slot });
    if (!client) {
        callbacks?.({
            success: false,
            data: null,
            message: "连接失败",
        });
        return;
    }
    let temperature = await client.startTask({ area, dbNumber, startByte, length, wordLength });
    if (!temperature) {
        return callbacks?.({
            success: false,
            data: null,
            message: "读取失败",
        });
    }
    let result = await onWriteQuery({ plcAddress, rack, slot, startByte, temperature });
    if (!result) {
        return callbacks?.({
            success: false,
            data: null,
            message: "写入失败",
        });
    }
    let key = `${plcAddress}-${rack}-${slot}-${startByte}`;
    if (taskRegisterObj[key]) {
        clearInterval(taskRegisterObj[key]);
    }
    console.log("🚀启动PLC任务");
    taskRegisterObj[key] = setInterval(async () => {
        let temperature = await client.startTask({ area, dbNumber, startByte, length, wordLength });
        if (temperature === false) return;
        let result = await onWriteQuery({ plcAddress, rack, slot, startByte, temperature });
        if (!result) return;
    }, 60 * 1000); // 60秒执行一次
    callbacks?.({
        success: true,
        data: key,
        message: "任务安排成功",
    });
}

/**
 * 结束任务
 * @param {Object} obj
 * @param {String} obj.key 任务的key
 * @returns {Promise}
 * */
async function onEndTask({ key = "" } = {}, callbacks) {
    if (!key) return callbacks?.({ success: false, message: "参数错误" });
    if (taskRegisterObj[key]) {
        clearInterval(taskRegisterObj[key]);
        delete taskRegisterObj[key];
    }
    callbacks?.({
        success: true,
        message: "任务已结束",
    });
}

/**
 * 获取所有任务
 * @param {Object} obj
 * @param {String} obj.token token
 * @returns {Promise}
 * */
async function onGetAllTasks({ token } = {}, callbacks) {
    if (token !== freezerTaskToken) {
        return callbacks?.({
            success: false,
            data: null,
            message: "token错误",
        });
    }
    callbacks?.({
        success: true,
        data: Object.keys(taskRegisterObj),
        message: "获取成功",
    });
}

/**
 *  连接PLC
 * @param {Object} obj
 * @param {String} obj.plcAddress PLC的IP地址
 * @param {Number} obj.rack 机架号
 * @param {Number} obj.slot 插槽号
 * @returns {Promise}
 */
async function startClient({ plcAddress = "127.0.0.1", rack = 16, slot = 1 } = {}) {
    let client = new nodeSnap7.S7Client();
    return new Promise((resolve, reject) => {
        try {
            client.ConnectTo(plcAddress, rack, slot, (err) => {
                if (err) {
                    console.log(new Date().toLocaleString(), "连接失败", err.message);
                    return resolve(false);
                }
                console.log(new Date().toLocaleString(), "连接成功");
                client.startTask = startTask;
                resolve(client);
            });
        } catch (e) {
            console.log(new Date().toLocaleString(), "连接失败", e.message);
            return resolve(false);
        }
    });
}

/**
 * 读取温度
 * @param {Object} obj
 * @param {Number} obj.area 读取的区域
 * @param {Number} obj.dbNumber DB块号
 * @param {Number} obj.startByte 起始字节
 * @param {Number} obj.length 读取的长度
 * @param {Number} obj.wordLength 字长
 * @returns {Promise}
 */
async function startTask({
    area = 0x84,
    dbNumber = 1,
    startByte = 1400,
    length = 4,
    wordLength = 0x04,
} = {}) {
    let client = this;
    // 使用 ReadArea 方法来读取 VD1400 的数据
    return new Promise((resolve, reject) => {
        client.ReadArea(area, dbNumber, startByte, length, wordLength, (err, res) => {
            if (err) {
                console.log(new Date().toLocaleString(), "读取失败", err);
                return resolve(false);
            }
            let buf = Buffer.from(res);
            let temperature = buf.readFloatBE(0); //32位浮点数 转换成摄氏度
            temperature = temperature.toFixed(2); //保留两位小数
            // console.log(new Date().toLocaleString(), "温度", temperature + "℃");
            temperature = Number(temperature);
            resolve(temperature);
        });
    });
}
