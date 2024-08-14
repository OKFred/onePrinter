import fs from "fs";
import path from "path";
import ipp from "ipp";

let printerURL = process.env["printerURL"];
let printer = ipp.Printer(printerURL); // 创建IPP客户端

export { onPrinterInfo, onPrintPDF };

async function onPrinterInfo(data, callbacks) {
    let printerResponse = await new Promise((resolve, reject) => {
        printer.execute("Get-Printer-Attributes", null, (err, response) => {
            let thisTime = new Date().toLocaleTimeString();
            if (err) {
                console.error(thisTime, "获取打印机信息失败:", err);
                resolve(false);
            } else {
                // console.log(thisTime, "获取打印机信息成功!");
                // console.log("打印机信息：:", response);
                resolve(response);
            }
        });
    });
    let result = {
        ok: printerResponse ? true : false,
        data: printerResponse,
        message: printerResponse ? "打印机信息获取成功" : "打印机信息获取失败",
    };
    return callbacks?.(result) || result;
}

async function onPrintPDF({ relativePath } = {}, callbacks) {
    if (!relativePath) {
        let result = { ok: false, data: null, message: "缺少入参：" + "relativePath" };
        return callbacks?.(result) || result;
    }
    //虚拟是/api/printer/public/，实际是/public/
    let _relativePath = relativePath.replace(/^\/api\/printer\/public\//g, "/public/");
    let absolutePath = path.join(process.cwd(), _relativePath);
    if (
        !fs.existsSync(absolutePath) ||
        !absolutePath.startsWith(path.join(process.cwd(), "public"))
    ) {
        let result = { ok: false, data: null, message: "文件不存在" };
        return callbacks?.(result) || result;
    } //检查最终路径是否在./public下，防止越权访问。
    let printerResponse = await print(fs.readFileSync(absolutePath));
    let thisTime = new Date().toLocaleTimeString();
    let isOK = /successful/.test(printerResponse?.statusCode);
    let message = isOK || printerResponse ? "打印任务已发送" : "打印任务发送失败";
    console.log(thisTime, message);
    let result = {
        ok: printerResponse ? true : false,
        data: printerResponse,
        message,
    };
    return callbacks?.(result) || result;
}

async function print(data) {
    // 创建打印任务的属性
    const jobAttributes = {
        "operation-attributes-tag": {
            "requesting-user-name": "张三",
            "job-name": "测试任务",
            "document-format": "application/pdf",
            "attributes-charset": "utf-8",
        },
        data,
    };
    // 发送打印任务
    return new Promise((resolve, reject) => {
        printer.execute("Print-Job", jobAttributes, (err, response) => {
            let thisTime = new Date().toLocaleTimeString();
            if (err) {
                console.error(thisTime, "任务发送失败:", err);
                resolve(false);
            } else {
                // console.log(thisTime, "任务发送成功!" + now);
                console.log(thisTime, "任务详情：:", response);
                resolve(response);
            }
        });
    });
}
