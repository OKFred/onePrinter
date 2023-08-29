import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pdfkit from "pdfkit";

let PDFDocument = pdfkit;
//let now = new Date().toLocaleString();

let __dirname = path.dirname(fileURLToPath(import.meta.url));
// console.log("当前目录：", __dirname);

export { onNewPDF };

// 创建PDF文档
async function onNewPDF({ textArr = [] } = {}, callbacks) {
    if (!textArr || !Array.isArray(textArr) || !textArr.length) {
        callbacks?.({
            success: false,
            data: null,
            message: "参数错误",
        });
        return;
    }
    let relativePath = "/public/打印" + new Date().getTime() + ".pdf";
    let absolutePath = path.join(process.cwd(), relativePath);
    let result = await new Promise((resolve, reject) => {
        const pdfDoc = new PDFDocument({
            font: path.join(__dirname, "黑体.ttf"),
            size: [4 * 72, 6 * 72], // 将英寸转换为点（1英寸 = 72点）
            margin: { left: 0, right: 0, top: 0, bottom: 0 }, // 设置边距
            bufferPages: true, // 允许将页面保存在内存中，以便稍后写入文件
        });

        // 将PDF写入文件
        const stream = pdfDoc.pipe(fs.createWriteStream(absolutePath));
        stream.on("finish", function () {
            let thisTime = new Date().toLocaleTimeString();
            console.log(thisTime, "PDF已就位");
            resolve(true);
        });

        // 插入图片到PDF
        /*         pdfDoc.image(path.join(process.cwd(), "/public/logo.png"), {
            fit: [25, 25], // 图片尺寸
            align: "left", // 图片对齐方式
            valign: "top", // 图片垂直对齐方式
            x: 50, // 左上角x坐标
            y: 0, // 左上角y坐标
        }); */
        // 设置虚线样式
        pdfDoc.dash(5, { space: 5 }); // 参数表示虚线段的长度和间距
        pdfDoc
            .moveTo(0, 23) // 起始坐标
            .lineTo(500, 23) // 结束坐标
            .stroke(); // 绘制线条
        // 重置虚线样式
        pdfDoc.undash();

        //const textArr = ["这是一个多行文本示例", "Trust AI technology", now];

        pdfDoc.moveUp(5); // 将绘图位置上移一个单位，相当于设置文本上边距为0
        textArr.forEach((line) => {
            pdfDoc.fontSize(12).text(line, { align: "center" });
            pdfDoc.moveDown(0.5); // 设置最小间距，单位是行高
        });
        // 结束PDF文档
        pdfDoc.end();
    });
    callbacks?.({
        success: result ? true : false,
        data: { relativePath },
        message: result ? "PDF文件已就位" : "PDF文件生成失败",
    });
}
