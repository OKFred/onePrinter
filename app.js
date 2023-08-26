import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import ipp from "ipp";
import pdfkit from "pdfkit";

let PDFDocument = pdfkit;
let now = new Date().toLocaleString();

let __dirname = path.dirname(fileURLToPath(import.meta.url));
//console.log("当前目录：", __dirname);
let pdfFilePath = "打印记录.pdf";
let printerURL = "http://172.28.0.118:631/printers/Zebra_Technologies_ZTC_GK888t_";
let printer = ipp.Printer(printerURL); // 创建IPP客户端

// 创建PDF文档
function makePDF() {
    const pdfDoc = new PDFDocument({
        font: path.join(__dirname, "黑体.ttf"),
        size: [4 * 72, 6 * 72], // 将英寸转换为点（1英寸 = 72点）
        margin: { left: 0, right: 0, top: 0, bottom: 0 }, // 设置边距
        bufferPages: true, // 允许将页面保存在内存中，以便稍后写入文件
    });

    // 将PDF写入文件
    pdfDoc.pipe(fs.createWriteStream(pdfFilePath));

    // 插入图片到PDF
    pdfDoc.image("./logo.png", {
        fit: [33, 33], // 图片尺寸
        align: "left", // 图片对齐方式
        valign: "top", // 图片垂直对齐方式
        x: 50, // 左上角x坐标
        y: 0, // 左上角y坐标
    });

    const textLines = ["这是一个多行文本示例", "Trust AI technology", now];

    pdfDoc.moveUp(5); // 将绘图位置上移一个单位，相当于设置文本上边距为0
    textLines.forEach((line) => {
        pdfDoc.fontSize(12).text(line, { align: "center" });
        pdfDoc.moveDown(0.5); // 设置最小间距，单位是行高
    });
    // 结束PDF文档
    pdfDoc.end();
}

function print(data) {
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
    printer.execute("Print-Job", jobAttributes, (err, response) => {
        if (err) {
            console.error("任务发送失败:", err);
        } else {
            console.log("任务发送成功!" + now);
            console.log("任务详情：:", response);
        }
    });
}

makePDF(); //暂时只支持现做的pdf，因为带图片的pdf，兼容性有待明确 2023-08-26
setTimeout(() => {
    let pdfBuffer = fs.readFileSync(pdfFilePath);
    print(pdfBuffer);
    console.log("done");
}, 1000);
