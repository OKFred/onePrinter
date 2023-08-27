import fs from "fs";
import path from "path";
import ipp from "ipp";

let printerURL = globalThis.envGetter("printerURL");
let printer = ipp.Printer(printerURL); // 创建IPP客户端

export { onPrinterInfo, onPrintPDF };

async function onPrinterInfo(data, callbacks) {
    let result = await new Promise((resolve, reject) => {
        printer.execute("Get-Printer-Attributes", null, (err, response) => {
            let thisTime = new Date().toLocaleTimeString();
            if (err) {
                console.error(thisTime, "获取打印机信息失败:", err);
                resolve(false);
            } else {
                console.log(thisTime, "获取打印机信息成功!");
                // console.log("打印机信息：:", response);
                resolve(response);
            }
        });
    });
    callbacks?.({
        success: result ? true : false,
        data: result,
        message: result ? "打印机信息获取成功" : "打印机信息获取失败",
    });
}

async function onPrintPDF({ pdfFilePath } = {}, callbacks) {
    if (!pdfFilePath) {
        return callbacks?.({ success: false, data: null, message: "缺少入参：" + "pdfFilePath" });
    }
    let filePath = path.join(process.cwd(), pdfFilePath);
    if (!fs.existsSync(filePath) || !filePath.startsWith(path.join(process.cwd(), "public"))) {
        return callbacks?.({ success: false, data: null, message: "文件不存在" });
    } //检查最终路径是否在./public下，防止越权访问。
    let result = await print(fs.readFileSync(filePath));
    let thisTime = new Date().toLocaleTimeString();
    let message = result ? "打印任务已发送" : "打印任务发送失败";
    console.log(thisTime, message);
    callbacks?.({
        success: result ? true : false,
        data: result,
        message,
    });
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
