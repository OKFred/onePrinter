/**
 * @author Fred
 * @desc 初始化入口
 * @since 2023-08-28 01:04:23
 */

import fs from "fs";
import dotenv from "dotenv";
import * as network from "./base/network.js";
console.log("当前时间：", new Date().toLocaleString());
console.log("🚀🚀🚀准备初始化。");
Object.assign(globalThis, network); //全局网络请求

(async function main() {
    await env();
    await init();
})(); //主函数

async function env() {
    await import("./base/proto_string.js");
    await import("./base/proto_array.js");
    await import("./base/proto_number.js");
    await import("./base/proto_date.js");
    dotenv.config(); //读取环境变量 .env
    console.log("✅环境准备完毕\n");
} //环境准备

(function checkIfEnvExists() {
    if (!process.env.TZ) process.env.TZ = "Asia/Shanghai";
    let destPath = "./.env";
    let srcPath = "./.env.example";
    if (!process.env["printerURL"] && !fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log("🚩首次加载，请配置目录下的.env");
        process.exit();
    }
})();

async function init() {
    console.log("🚩引入实例");
    await import("./api/index.js");
} //引入实例

setInterval(() => {} /*  console.log("keep alive") */, 1000 * 60 * 60 * 24);
