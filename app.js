/**
 * @author Fred
 * @desc 初始化入口
 * @since 2023-08-28 01:04:23
 */

import dotenv from "dotenv";
import fs from "fs";
import * as network from "./base/network.js";
console.log("当前时间：", new Date().toLocaleString());
console.log("🚀🚀🚀准备初始化。");
Object.assign(globalThis, network); //全局网络请求

(function checkIfEnvExists() {
    let path = "./.env";
    if (!fs.existsSync(path)) {
        fs.writeFileSync(
            path,
            `# 环境变量
PORT=9009
printerURL=
sessionSecret=
WEBSOCKET_SERVER_URL=ws://127.0.0.1:9099/

# 打印机语言
printerID=CPCL

# 纸张大小设置
printerPaperWidth=80
printerPaperHeight=50
`,
        );
        console.log("🚩首次加载，请配置目录下的.env");
        process.exit();
    }
})();

(async function main() {
    await env();
    await init();
})(); //主函数

async function env() {
    await import("./base/proto_string.js");
    await import("./base/proto_array.js");
    await import("./base/proto_number.js");
    await import("./base/proto_date.js");
    console.log("✅环境准备完毕\n");
} //环境准备

async function init() {
    console.log("🚩引入实例");
    await import("./api/index.js");
} //引入实例

global.envGetter = function envGetter(key) {
    const config = dotenv.config();
    if (config.error) return console.log("环境变量解析失败，请重新配置");
    let envObj = config.parsed;
    if (key === undefined) return envObj;
    return envObj[key];
}; //读取环境变量 .env

setInterval(() => console.log("keep alive"), 1000 * 60 * 60 * 24);
