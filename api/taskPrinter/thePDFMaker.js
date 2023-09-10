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
async function onNewPDF({ textArr = [], paperWidth = "", paperHeight = "" } = {}, callbacks) {
    if (!textArr || !Array.isArray(textArr) || !textArr.length) {
        callbacks?.({
            success: false,
            data: null,
            message: "参数错误",
        });
        return;
    }
    if (!paperWidth) paperWidth = printerPaperWidth;
    if (!paperHeight) paperHeight = printerPaperHeight;
    let relativePath = "/public/打印" + new Date().getTime() + ".pdf";
    let absolutePath = path.join(process.cwd(), relativePath);
    let result = await new Promise((resolve, reject) => {
        let pdfDoc = new PDFDocument({
            font: path.join(__dirname, font_regular),
            size: [(paperWidth * 72) / 25.4, (paperHeight * 72) / 25.4], // 将 mm 转换为英寸，并考虑了默认的 DPI 值（72）。
            margins: { left: 0, right: 0, top: 0, bottom: 0 }, // 设置边距
            bufferPages: true, // 允许将页面保存在内存中，以便稍后写入文件
        });
        let doc = pdfDoc;

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

        // 获取页面的宽度
        let pageWidth = doc.page.width;
        let pageHeight = doc.page.height;

        // 计算表格的宽度为页面宽度的90%
        let tableWidth = pageWidth * 0.9;

        // 设置表头背景颜色、文本颜色和边框颜色
        let headerBackgroundColor = "#CCCCCC"; // 灰色背景色
        let textColor = "#000000"; // 黑色文本颜色
        let borderColor = "#000000"; // 黑色边框颜色

        // 定义表头文本
        let headerText = ["Header 1", "Header 2", "Header 3", "Header 4", "Header 5"];
        let dataArr = [
            ["Row 1, Col 1", "Row 1, Col 2", "Row 1, Col 3", "Row 1, Col 4", "Row 1, Col 5"],
            ["Row 2, Col 1", "Row 2, Col 2", "Row 2, Col 3", "Row 2, Col 4", "Row 2, Col 5"],
            ["Row 3, Col 1", "Row 3, Col 2", "Row 3, Col 3", "Row 3, Col 4", "Row 3, Col 5"],
            ["Row 4, Col 1", "Row 4, Col 2", "Row 4, Col 3", "Row 4, Col 4", "Row 4, Col 5"],
            ["Row 5, Col 1", "Row 5, Col 2", "Row 5, Col 3", "Row 5, Col 4", "Row 5, Col 5"],
            ["Row 6, Col 1", "Row 6, Col 2", "Row 6, Col 3", "Row 6, Col 4", "Row 6, Col 5"],
            ["Row 7, Col 1", "Row 7, Col 2", "Row 7, Col 3", "Row 7, Col 4", "Row 7, Col 5"],
            ["Row 8, Col 1", "Row 8, Col 2", "Row 8, Col 3", "Row 8, Col 4", "Row 8, Col 5"],
            ["Row 9, Col 1", "Row 9, Col 2", "Row 9, Col 3", "Row 9, Col 4", "Row 9, Col 5"],
            ["Row 10, Col 1", "Row 10, Col 2", "Row 10, Col 3", "Row 10, Col 4", "Row 10, Col 5"],
            ["Row 11, Col 1", "Row 11, Col 2", "Row 11, Col 3", "Row 11, Col 4", "Row 11, Col 5"],
        ];

        // 定义表格的列数和行数
        let numColumns = headerText.length;
        let numRows = dataArr.length;
        // 调整字体大小
        let fontSize = 6;
        let fontRowHeightMapping = {
            6: 20,
            7: 23,
            8: 26,
            9: 29,
            10: 32,
            11: 35,
            12: 38,
            13: 41,
            14: 44,
            15: 47,
            16: 50,
            17: 53,
            18: 56,
        };

        // 定义行高
        let rowHeight = fontRowHeightMapping[fontSize]; // 调整行高
        let headerHeight = rowHeight; // 调整表头高度
        let marginTopOrBottom = 10;
        let cellMarginLeftOrRight = 5;

        let idealMaxDataRows = Math.floor(
            (pageHeight - marginTopOrBottom * 2 - headerHeight) / rowHeight,
        ); //表格理想行数
        let idealTableHeight = idealMaxDataRows * rowHeight + headerHeight; //表格的理想高度
        let cellWidth = tableWidth / numColumns; //单元格宽度
        let heightAlready = doc.y;
        let pageAlready = doc._pageBuffer.length;
        let tableStartY = heightAlready + marginTopOrBottom; //表格实际起始位置
        let firstPageTableHeight = pageHeight - tableStartY - marginTopOrBottom;
        let pagesNeededForThisTable; // 需要的页数
        let firstPageTableRows; // 第一页的行数
        if (firstPageTableHeight === idealTableHeight) {
            pagesNeededForThisTable = Math.ceil(numRows / idealMaxDataRows);
            firstPageTableRows = idealMaxDataRows;
        } // 如果第一页的高度刚好够，则正常计算需要的页数
        else {
            checkFirstPage(); // 检查第一页的高度是否够用
            firstPageTableHeight = pageHeight - tableStartY - marginTopOrBottom;
            firstPageTableRows = Math.floor((firstPageTableHeight - headerHeight) / rowHeight);
            pagesNeededForThisTable =
                Math.ceil((numRows - firstPageTableRows) / idealMaxDataRows) + 1;
        } // 如果第一页的高度不够，则需要的页数为：第一页的高度不够的行数 + 剩余行数 / 理想行数
        console.log("需要的页数", pagesNeededForThisTable);
        function checkFirstPage() {
            if (firstPageTableHeight < headerHeight + rowHeight) {
                doc.addPage();
                tableStartY = marginTopOrBottom;
                pageAlready = doc._pageBuffer.length;
                pagesNeededForThisTable--;
            } // 如果第一页的高度不够，就添加一页
        }
        function makeHeader() {
            // 绘制表头背景色、文本和边框
            doc.rect(cellMarginLeftOrRight, tableStartY, tableWidth, rowHeight)
                .fill(headerBackgroundColor)
                .fillColor(textColor)
                .fontSize(fontSize)
                .strokeColor(borderColor) // 设置边框颜色
                .stroke(); // 绘制边框
            headerText.forEach((text, index) => {
                let columnWidth = tableWidth / numColumns;
                let x = index * columnWidth + cellMarginLeftOrRight;
                let y = marginTopOrBottom; // 加上表头的高度
                // 绘制文本和边框
                doc.rect(x, y, columnWidth, rowHeight)
                    .fillColor(textColor)
                    .fontSize(fontSize)
                    .stroke(); // 绘制边框
                doc.text(text, x + 1, y + 1); // 调整文本位置以居中
            });
        }

        function makeBody(i) {
            // 绘制表格数据
            let rowsAllowed = i === 0 ? firstPageTableRows : idealMaxDataRows;
            for (let j = 0; j < rowsAllowed; j++) {
                let data = [];
                for (let k = 0; k < numColumns; k++) {
                    data.push(`Row ${i * rowsAllowed + j + 1}, Col ${k + 1}`);
                }
                let _currentPageNumber = doc._pageBuffer.length;
                console.log("当前页", _currentPageNumber);
                let y = j * rowHeight + marginTopOrBottom + rowHeight; // 加上表头的高度
                for (let k = 0; k < numColumns; k++) {
                    let columnWidth = tableWidth / numColumns;
                    let x = k * columnWidth + cellMarginLeftOrRight;

                    // 绘制文本和边框
                    doc.rect(x, y, columnWidth, rowHeight)
                        .fillColor(textColor)
                        .fontSize(fontSize)
                        .stroke(); // 绘制边框

                    doc.text(data[k], x + 1, y + 1); // 调整文本位置以居中
                }
            }
        }
        for (let i = 0; i < pagesNeededForThisTable; i++) {
            makeHeader();
            makeBody(i);
            if (doc._pageBuffer.length < pagesNeededForThisTable + pageAlready - 1) {
                doc.addPage();
            }
        }
        console.log(doc.x, doc.y);
        console.log("当前页", doc._pageBuffer.length);

        // 结束PDF文档
        pdfDoc.end();
    });
    callbacks?.({
        success: result ? true : false,
        data: { relativePath },
        message: result ? "PDF文件已就位" : "PDF文件生成失败",
    });
}
