// nodejs with s7 200 smart plc, using es module

import fs from "fs";
import path from "path";
import url from "url";
import nodeSnap7 from "node-snap7";
import { onWriteQuery } from "./theTempSaver.js";
// import todoArr from "todo.json" assert { type: "json" };

let freezerTaskToken = globalThis.envGetter("freezerTaskToken") || "";
let taskRegisterObj = {};
let __dirname = path.dirname(url.fileURLToPath(import.meta.url)); //当前目录

export { onNewTask, onEndTask, onStartAllTasks, onGetAllTasks };

/**
 * 准备工作
 * */
function prepare() {
    let todoArr = [];
    try {
        let filePath = path.join(__dirname, "todo.json");
        todoArr = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {
        console.log(e);
        console.log(
            "todo.json文件不存在或格式错误，已创建空文件，请配置以便`onStartAllTasks`函数正常工作",
        );
        fs.writeFileSync(filePath, "[]", "utf-8");
    }
    return todoArr;
}
prepare();

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
        rack = 8,
        slot = 0,
        area = 0x84,
        dbNumber = 1,
        startByte = 0,
        length = 4,
        wordLength = 0x04,
    } = {},
    callbacks,
) {
    [rack, slot, startByte] = [rack, slot, startByte].map((obj) => Number(obj));
    if ([rack, slot, startByte].some((obj) => isNaN(obj)) || !plcAddress || !rack || !startByte) {
        callbacks?.({
            success: false,
            data: null,
            message: "参数错误",
        });
        return false;
    } //判断格式和非空
    let client = await startClient({ plcAddress, rack, slot });
    if (!client) {
        callbacks?.({
            success: false,
            data: null,
            message: "连接失败",
        });
        return false;
    }
    let temperature = await client.startTask({ area, dbNumber, startByte, length, wordLength });
    if (!temperature) {
        callbacks?.({
            success: false,
            data: null,
            message: "读取失败",
        });
        return false;
    }
    let result = await onWriteQuery({ plcAddress, rack, slot, startByte, temperature });
    if (!result) {
        callbacks?.({
            success: false,
            data: null,
            message: "写入失败",
        });
        return false;
    }
    let key = `${plcAddress}-${rack}-${slot}-${startByte}`;
    if (taskRegisterObj[key]) {
        clearInterval(taskRegisterObj[key]);
    }
    console.log("🚀启动PLC任务");
    taskRegisterObj[key] = setInterval(async () => {
        let client = await startClient({ plcAddress, rack, slot });
        if (client === false) return console.log("当前任务：", key);
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
    return true;
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
 * 启动所有任务
 * @param {Object} obj
 * @param {String} obj.token token
 * @returns {Promise}
 * */
async function onStartAllTasks({ token } = {}, callbacks) {
    if (token !== freezerTaskToken) {
        return callbacks?.({
            success: false,
            data: null,
            message: "token错误",
        });
    }
    let todoArr = prepare();
    let try_count = 0;
    let success_count = 0;
    let _callbacks = ({ success }) => {
        if (success) success_count++;
    };
    for (let { id, freezerName, doorName, plcAddress, startByte } of todoArr) {
        try_count++;
        console.log("当前任务：", id, freezerName, doorName);
        await onNewTask({ plcAddress, startByte }, _callbacks);
        // await globalThis.sleep(1000); //等待1秒
    }
    console.log("总任务数：", todoArr.length);
    if (success_count === 0) return callbacks({ success: false, message: "轮询任务创建失败" });
    else if (success_count < try_count) {
        console.log("成功数", success_count);
        return callbacks({ success: false, message: "部分轮询任务创建失败" });
    }
    return callbacks({ success: true, message: "轮询任务创建成功" });
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
    let keyArr = Object.keys(taskRegisterObj);
    let todoArr = prepare();
    let mappingArr = keyArr.map((key) => {
        let [plcAddress, rack, slot, startByte] = key.split("-");
        let { id, freezerName, doorName } =
            todoArr.find(
                (obj) => obj.plcAddress === plcAddress && obj.startByte === Number(startByte),
            ) || {};
        return { id, freezerName, doorName, plcAddress, rack, slot, startByte };
    });
    let filteredArr = mappingArr.filter((obj) => obj.id);
    callbacks?.({
        success: true,
        data: filteredArr,
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
async function startClient({ plcAddress = "127.0.0.1", rack = 8, slot = 0 } = {}) {
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
                client.Disconnect(); //查询完即断开连接，避免占用资源
                return resolve(false);
            }
            let buf = Buffer.from(res);
            let temperature = buf.readFloatBE(0); //32位浮点数 转换成摄氏度
            temperature = temperature.toFixed(2); //保留两位小数
            // console.log(new Date().toLocaleString(), "温度", temperature + "℃");
            temperature = Number(temperature);
            client.Disconnect(); //查询完即断开连接，避免占用资源
            resolve(temperature);
        });
    });
}
