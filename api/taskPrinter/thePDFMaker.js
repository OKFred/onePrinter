import fs from "fs";
import path from "path";
import url from "url";
import pdfkit from "pdfkit";

let __dirname = path.dirname(url.fileURLToPath(import.meta.url)); //当前目录
let PDFDocument = pdfkit;
let font_regular = "SourceHanSansCN-Regular.ttf";
let font_bold = "SourceHanSansCN-Bold.ttf";

let printerPaperWidth = globalThis.envGetter("printerPaperWidth");
let printerPaperHeight = globalThis.envGetter("printerPaperHeight");

export { onNewPDF };

//准备工作
function prepare() {
    if (!fs.existsSync("public")) {
        fs.mkdirSync("public");
        console.log("未配置public目录，已自动生成");
    }
    let uploadFolderPath = path.join("public", "uploads");
    if (!fs.existsSync(uploadFolderPath)) {
        fs.mkdirSync(uploadFolderPath);
        console.log("未配置public/uploads目录，已自动生成");
    }
}
prepare();

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
        let pdfDoc = new PDFDocument({
            font: path.join(__dirname, font_regular),
            size: [(printerPaperWidth * 72) / 25.4, (printerPaperHeight * 72) / 25.4], // 将 mm 转换为英寸，并考虑了默认的 DPI 值（72）。
            margins: { left: 0, right: 0, top: 0, bottom: 0 }, // 设置边距
            bufferPages: true, // 允许将页面保存在内存中，以便稍后写入文件
        });

        // 将PDF写入文件
        let stream = pdfDoc.pipe(fs.createWriteStream(absolutePath));
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
        /*    pdfDoc.dash(5, { space: 5 }); // 参数表示虚线段的长度和间距
        pdfDoc
            .moveTo(0, 23) // 起始坐标
            .lineTo(500, 23) // 结束坐标
            .stroke(); // 绘制线条
        // 重置虚线样式
        pdfDoc.undash(); */

        /*         let textArr = [
            { value: "这是一个多行文本示例" },
            {
                value: "红美人西瓜1个",
                style: {
                    align: "left",
                    indent: 50,
                    fontWeight: "bold",
                    fontSize: 14,
                },
            },
        ]; */

        // pdfDoc.moveDown(0.5); // 将绘图位置下移一个单位
        for (let textObj of textArr) {
            if (typeof textObj !== "object") {
                try {
                    textObj = JSON.parse(textObj);
                } catch (e) {}
            }
            let { value = "", style = {}, addPage } = textObj || {};
            if (addPage) {
                pdfDoc.addPage();
                continue;
            } // 手动添加新页面
            if (typeof style !== "object") style = {};
            style = { align: "center", height: 1, lineGap: 1, fontSize: 16, ...style };
            if (style.fontWeight === "bold") pdfDoc.font(path.join(__dirname, font_bold));
            else pdfDoc.font(path.join(__dirname, font_regular));
            let textArgs = [value, style];
            if (style["align"] === "right" && style["indent"]) {
                let indent = Number(style["indent"]);
                if (isNaN(indent)) indent = 0;
                textArgs = [value, indent, pdfDoc["y"], style];
            }
            pdfDoc.fontSize(style["fontSize"] || 16).text(...textArgs);
        }
        // 结束PDF文档
        pdfDoc.end();
    });
    callbacks?.({
        success: result ? true : false,
        data: { relativePath },
        message: result ? "PDF文件已就位" : "PDF文件生成失败",
    });
}
