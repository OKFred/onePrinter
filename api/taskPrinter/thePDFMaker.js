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
async function onNewPDF(
    {
        paperWidth = "",
        paperHeight = "",
        textArr,
        textStyle,
        tableColumnArr,
        tableRowArr,
        tableStyle,
        tableConfig,
        imageArr,
        imageStyle,
        dashArr,
        dashStyle,
        mixinArr,
    } = {},
    callbacks,
) {
    if (!Array.isArray(textArr) && !Array.isArray(tableRowArr)) {
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

        let makeAll = () => {
            if (textArr) {
                makePDFParagraph({ doc, textArr, textStyle });
            }
            if (imageArr) {
                makePDFImage({ doc, imageArr, imageStyle });
            }
            if (dashArr) {
                makePDFDash({ doc, dashArr, dashStyle });
            }
            if (tableColumnArr && tableRowArr) {
                makePDFTable({ doc, tableColumnArr, tableRowArr, tableStyle, tableConfig });
            } // 绘制表格
        };
        if (mixinArr && Array.isArray(mixinArr)) {
            let leftCountObj = {
                textArr: textArr?.length || 0,
                imageArr: imageArr?.length || 0,
                dashArr: dashArr?.length || 0,
                tableRowArr: tableRowArr?.length || 0,
            };
            let pageNum = 1;
            let finishCheck = () => {
                if (
                    leftCountObj["textArr"] <= 0 &&
                    leftCountObj["imageArr"] <= 0 &&
                    leftCountObj["dashArr"] <= 0 &&
                    leftCountObj["tableRowArr"] <= 0
                )
                    return true;
                return false;
            };
            let maxIteration = 100;
            let makeMixins = () => {
                if (maxIteration <= 0) return;
                maxIteration--;
                for (let mixinObj of mixinArr) {
                    let { label, value } = mixinObj || {};
                    if (label === "textArr") {
                        if (leftCountObj[label] <= 0) continue;
                        let newTextArr = textArr.splice(0, value);
                        makePDFParagraph({
                            doc,
                            textArr: newTextArr,
                            textStyle,
                            noPagination: true,
                        });
                        leftCountObj[label] = leftCountObj[label] - value;
                    } else if (label === "imageArr") {
                        if (leftCountObj[label] <= 0) continue;
                        let newImageArr = imageArr.splice(0, value);
                        makePDFImage({
                            doc,
                            imageArr: newImageArr,
                            imageStyle,
                            noPagination: true,
                        });
                        leftCountObj[label] = leftCountObj[label] - value;
                    } else if (label === "dashArr") {
                        if (leftCountObj[label] <= 0) continue;
                        let newDashArr = dashArr.splice(0, value);
                        makePDFDash({ doc, dashArr: newDashArr, dashStyle, noPagination: true });
                        leftCountObj[label] = leftCountObj[label] - value;
                    } else if (label === "tableRowArr") {
                        if (leftCountObj[label] <= 0) continue;
                        let newTableRowArr = tableRowArr.splice(0, value);
                        makePDFTable({
                            doc,
                            tableColumnArr,
                            tableRowArr: newTableRowArr,
                            tableStyle,
                            tableConfig,
                            noPagination: true,
                        });
                        leftCountObj[label] = leftCountObj[label] - value;
                    }
                }
                if (!finishCheck()) {
                    pageNum++;
                    doc.addPage();
                    makeMixins();
                }
            };
            makeMixins();
        } else makeAll();
        // 结束PDF文档
        pdfDoc.end();
    });
    callbacks?.({
        success: result ? true : false,
        data: { relativePath },
        message: result ? "PDF文件已就位" : "PDF文件生成失败",
    });
}

function makePDFParagraph({ doc, textArr, textStyle = {}, noPagination = false } = {}) {
    for (let textObj of textArr) {
        if (typeof textObj !== "object") {
            try {
                textObj = JSON.parse(textObj);
            } catch (e) {}
        }
        let { value = "", style = {}, addPage } = textObj || {};
        if (addPage && !noPagination) {
            doc.addPage();
            continue;
        } // 手动添加新页面
        if (!style || typeof style !== "object") style = {};
        style = { align: "center", height: 1, lineGap: 1, fontSize: 16, ...textStyle, ...style }; // 默认样式
        if (style.fontWeight === "bold") doc.font(path.join(__dirname, font_bold));
        else doc.font(path.join(__dirname, font_regular));
        let textArgs = [value, style];
        if (style["align"] === "right" && style["indent"]) {
            let indent = Number(style["indent"]);
            if (isNaN(indent)) indent = 0;
            textArgs = [value, indent, doc["y"], style];
        }
        doc.fontSize(style["fontSize"] || 16).text(...textArgs);
    }
}

function makePDFImage({
    doc,
    imageArr,
    imageStyle = {
        // fit: [25, 25], // 图片尺寸
        // align: "left", // 图片对齐方式
        // valign: "top", // 图片垂直对齐方式
        // x: 50, // 左上角x坐标
        // y: 0, // 左上角y坐标
    },
    noPagination = false,
} = {}) {
    if (!Array.isArray(imageArr)) return;
    for (let imageObj of imageArr) {
        let { relativePath } = imageObj || {};
        let absolutePath = path.join(process.cwd(), relativePath);
        if (
            !relativePath ||
            /http/i.test(relativePath) ||
            !fs.existsSync(absolutePath) ||
            !absolutePath.startsWith(path.join(process.cwd(), "public"))
        ) {
            continue;
        }
        doc.image(absolutePath, imageStyle);
        // pdfDoc.moveDown(0.5); // 将绘图位置下移一个单位
    }
} // 插入图片到PDF

function makePDFDash({ doc, dashArr, dashStyle = { space: 5, length: 5 }, noPagination = false }) {
    if (!Array.isArray(dashArr)) return;
    for (let dashObj of dashArr) {
        let { value, style } = dashObj || {};
        if (!style) style = dashStyle;
        let { startX, endX, startY, endY } = value || {};
        doc.dash(style.length, ength, style); // 参数表示虚线段的长度和间距
        doc.moveTo(startX, startY) // 起始坐标
            .lineTo(endX, endY) // 结束坐标
            .stroke(); // 绘制线条
        doc.undash(); // 重置虚线样式
    }
} // 设置虚线样式

function makePDFTable({
    doc,
    tableRowArr,
    tableColumnArr,
    tableStyle = {
        backgroundColor: "wheat", // 灰色背景色
        color: "#000000", // 黑色文本颜色
        borderColor: "#000000", // 黑色边框颜色
        fontSize: 8,
    },
    tableConfig = {},
    noPagination = false,
} = {}) {
    let _config = {
        页面高度: doc.page.height,
        页面宽度: doc.page.width,
        起始页码: doc._pageBuffer.length,
        起始位置: doc.y,
        字体大小: 8,
        表格列数: tableColumnArr.length,
        表体行数: tableRowArr.length,
        表格上下间距比: 5, //%
        表格左右间距比: 5, //%
        //待计算属性
        表格上下间距: "",
        表格左右间距: "",
        表头单行高度: "",
        表体单行高度: "",
        表格宽度: "",
        表格各单元格宽度比: "", //数组
        表格各单元格宽度: "", //数组
        表格理想高度: "",
        表格最低高度: "",
        表格单页可用高度: "",
        表格单页可用行数: "",
        表格单页使用高度: "",
        表格单页起始坐标: "", //数组
        起始页表格可用高度: "",
        表格第一页页码: "",
        表格另起一页判断: "",
        表格第一页可用高度: "",
        表格第一页可用行数: "",
        表格第一页行数: "",
        表格第一页高度: "",
        表格第一页起始坐标: "", //数组
        表体剩余行数: "",
        表格剩余所需页数: "",
        表格所需总页数: "",
        //计算方法
        表格上下间距计算: () => (_config["页面高度"] * _config["表格上下间距比"]) / 100,
        表格左右间距计算: () => (_config["页面宽度"] * _config["表格左右间距比"]) / 100,
        表头单行高度计算: () => getCellHeight(_config["字体大小"]),
        表体单行高度计算: () => getCellHeight(_config["字体大小"]),
        表格宽度计算: () => _config["页面宽度"] - _config["表格左右间距"] * 2,
        表格各单元格宽度计算: () => getCellWidthArr(tableColumnArr, tableConfig.ratioArr),
        表格理想高度计算: () =>
            _config["表头单行高度"] * _config["表体行数"] + 1 * _config["表体单行高度"], //无限高的表格所需的高度
        表格最低高度计算: () => _config["表头单行高度"] + _config["表体单行高度"], //表头+表体*1行
        表格单页可用高度计算: () => _config["页面高度"] - _config["表格上下间距"] * 2, //刨去间距
        表格单页可用行数计算: () =>
            Math.floor(
                (_config["表格单页可用高度"] - _config["表头单行高度"]) / _config["表体单行高度"],
            ), //单页表格可用行数，向下取整（不含表头）
        表格单页使用高度计算: () =>
            _config["表格单页可用行数"] * _config["表体单行高度"] + _config["表头单行高度"],
        表格单页起始坐标计算: () => [_config["表格左右间距"], _config["表格上下间距"]],
        起始页表格可用高度计算: () =>
            _config["页面高度"] - _config["起始位置"] - _config["表格上下间距"] * 2, //可能为负
        表格第一页页码计算: () =>
            _config["起始页表格可用高度"] > 0 ? _config["起始页码"] : _config["起始页码"] + 1, //判断表格是否和段落在同一页，页码不同则表格可用高度不同
        表格另起一页判断计算: () => _config["表格第一页页码"] > _config["起始页码"],
        表格第一页可用高度计算: () =>
            _config["表格另起一页判断"]
                ? _config["页面高度"] - _config["表格上下间距"] * 2
                : _config["起始页表格可用高度"], //不用分页，则段落和表格能共存，否则表格另起一页
        表格第一页可用行数计算: () =>
            Math.floor(
                (_config["表格第一页可用高度"] - _config["表头单行高度"]) / _config["表体单行高度"],
            ), //第一页表体行数，向下取整（不含表头）
        表格第一页行数计算: () =>
            _config["表体行数"] > _config["表格第一页可用行数"]
                ? _config["表格第一页可用行数"]
                : _config["表体行数"],
        表格第一页高度计算: () =>
            _config["表格第一页行数"] * _config["表体单行高度"] + _config["表头单行高度"],
        表格第一页起始坐标计算: () => [
            _config["表格左右间距"],
            _config["表格另起一页判断"]
                ? _config["表格上下间距"]
                : _config["起始位置"] + _config["表格上下间距"],
        ],
        表体剩余行数计算: () => _config["表体行数"] - _config["表格第一页可用行数"], //表体行数大于第一页消耗的行数，则拆分
        表格剩余所需页数计算: () =>
            _config["表体剩余行数"] < 0
                ? 0
                : Math.ceil(_config["表体剩余行数"] / _config["表格单页可用行数"]),
        表格所需总页数计算: () => _config["表格剩余所需页数"] + 1,
    };
    function main() {
        init();
        // console.log(_config);
        makeTable();
    }
    main();

    function init() {
        _config["表格上下间距"] = _config["表格上下间距计算"]();
        _config["表格左右间距"] = _config["表格左右间距计算"]();
        _config["表头单行高度"] = _config["表头单行高度计算"]();
        _config["表体单行高度"] = _config["表体单行高度计算"]();
        _config["表格宽度"] = _config["表格宽度计算"]();
        _config["表格各单元格宽度"] = _config["表格各单元格宽度计算"]();
        _config["表格理想高度"] = _config["表格理想高度计算"]();
        _config["表格最低高度"] = _config["表格最低高度计算"]();
        _config["表格单页可用高度"] = _config["表格单页可用高度计算"]();
        _config["表格单页可用行数"] = _config["表格单页可用行数计算"]();
        _config["表格单页使用高度"] = _config["表格单页使用高度计算"]();
        _config["表格单页起始坐标"] = _config["表格单页起始坐标计算"]();
        _config["起始页表格可用高度"] = _config["起始页表格可用高度计算"]();
        _config["表格第一页页码"] = _config["表格第一页页码计算"]();
        _config["表格另起一页判断"] = _config["表格另起一页判断计算"]();
        _config["表格第一页可用高度"] = _config["表格第一页可用高度计算"]();
        _config["表格第一页可用行数"] = _config["表格第一页可用行数计算"]();
        _config["表格第一页行数"] = _config["表格第一页行数计算"]();
        _config["表格第一页高度"] = _config["表格第一页高度计算"]();
        _config["表格第一页起始坐标"] = _config["表格第一页起始坐标计算"]();
        _config["表体剩余行数"] = _config["表体剩余行数计算"]();
        _config["表格剩余所需页数"] = _config["表格剩余所需页数计算"]();
        _config["表格所需总页数"] = _config["表格所需总页数计算"]();
    }

    function makeTable() {
        if (_config["表格单页可用高度计算"] < 0) return false; //表格高度不够一页
        if (_config["表格另起一页判断"]) {
            //先做第一页
            //表格和段落不在同一页
            if (!noPagination) doc.addPage();
        }
        //绘制表头
        let pageOneCoordArr = _config["表格第一页起始坐标"];
        if (!Array.isArray(pageOneCoordArr) || pageOneCoordArr.length !== 2) return false;
        const current_x = pageOneCoordArr[0]; //左边距偏移
        let current_y = pageOneCoordArr[1]; //上边距偏移
        makeRow(
            current_x,
            current_y,
            tableColumnArr,
            _config["表头单行高度"],
            tableStyle["backgroundColor"],
        );
        current_y = current_y + _config["表头单行高度"];
        //将tableRowArr数据进行拆分，分成第一页的数据，和剩余的数据
        let tableRowFirstPageArr = tableRowArr.slice(0, _config["表格第一页行数"]);
        let tableRowRestPageArr = tableRowArr.slice(_config["表格第一页行数"]) || [];
        let rowLeftCount = _config["表体剩余行数"];
        for (let rowArr of tableRowFirstPageArr) {
            makeRow(current_x, current_y, rowArr, _config["表体单行高度"]);
            current_y = current_y + _config["表体单行高度"];
        }
        if (rowLeftCount <= 0) return;
        if (!noPagination) doc.addPage();
        for (let i = 0; i < _config["表格剩余所需页数"]; i++) {
            let pageRowCount =
                _config["表格单页可用行数"] < rowLeftCount
                    ? _config["表格单页可用行数"]
                    : rowLeftCount; //占满整页
            current_y = _config["表格单页起始坐标"][1];
            makeRow(
                current_x,
                current_y,
                tableColumnArr,
                _config["表头单行高度"],
                tableStyle["backgroundColor"],
            );
            current_y = current_y + _config["表头单行高度"];
            let tableRowThisPageArr = tableRowRestPageArr.slice(0, _config["表格单页可用行数"]);
            for (let rowArr of tableRowThisPageArr) {
                makeRow(current_x, current_y, rowArr, _config["表体单行高度"]);
                current_y = current_y + _config["表体单行高度"];
            }
            tableRowRestPageArr = tableRowRestPageArr.slice(_config["表格单页可用行数"]);
            rowLeftCount = rowLeftCount - pageRowCount;
            if (i !== _config["表格剩余所需页数"] - 1 && !noPagination) doc.addPage();
            // console.log("分页", doc._pageBuffer.length, doc.x, doc.y);
        } //绘制剩余的表格
    }

    function makeRow(x, y, rowArr, rowHeight, backgroundColor) {
        let current_x = _config["表格左右间距"]; //左边距偏移
        let columnWidthArr = _config["表格各单元格宽度"];
        doc.rect(x, y, _config["表格宽度"], rowHeight);
        if (backgroundColor) doc.fill(backgroundColor); //背景色
        doc.fillColor(tableStyle["color"])
            .fontSize(tableStyle["fontSize"])
            .strokeColor(tableStyle["borderColor"]) // 设置边框颜色
            .stroke(); // 绘制边框
        rowArr.forEach((text, index) => {
            let columnWidth = columnWidthArr[index]; //单元格宽度
            let cell_x = current_x; //单元格起始坐标
            let cell_y = y;
            let text_x = cell_x + 2;
            let text_y = cell_y + _config["表头单行高度"] / 4;
            doc.rect(cell_x, cell_y, columnWidth, _config["表头单行高度"])
                // .fill(backgroundColor)
                .fillColor(tableStyle["color"])
                .fontSize(tableStyle["fontSize"])
                .stroke(); // 绘制边框
            doc.text(text, text_x, text_y); // 调整文本位置以居中
            current_x = cell_x + columnWidth; //下一个单元格的起始坐标
        }); // 绘制文本和边框
    }

    // 调整字体大小
    function getCellHeight(fontSize) {
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
        return fontRowHeightMapping[fontSize]; // 调整行高
    }

    function getCellWidthArr(tableColumnArr, ratioArr) {
        let current_x = _config["表格左右间距"]; //左边距偏移
        let ratioCondition1 = ratioArr && ratioArr.length === tableColumnArr.length;
        let ratioCondition2 =
            ratioCondition1 &&
            ratioArr.map((ratio) => Number(ratio)).filter((ratio) => !isNaN(ratio)).length ===
                ratioArr.length;
        let ratioConditon3 =
            ratioCondition2 && ratioArr.reduce((a, b) => [a, b].calc("+"), 0) === 1;
        if (ratioConditon3) {
            _config["表格各单元格宽度比"] = ratioArr.map((ratio) => Number(ratio));
            return _config["表格各单元格宽度比"].map((ratio) => {
                let columnWidth = _config["表格宽度"] * ratio; //单元格宽度
                let cell_x = current_x; //单元格起始坐标
                current_x = cell_x + columnWidth; //下一个单元格的起始坐标
                return columnWidth;
            });
        }
        let totalText = tableColumnArr.join(""); //表头文本总长度
        let fullWidthCount = countFullWidthCharacters(totalText); //全角字符的个数
        let totalLength = totalText.length + fullWidthCount; //总长度
        return tableColumnArr.map((text) => {
            let _fullWidthCount = countFullWidthCharacters(text); //全角字符的个数
            let textLength = text.length + _fullWidthCount; //总长度
            let ratio = textLength / totalLength; //占比
            let columnWidth = _config["表格宽度"] * ratio; //单元格宽度
            let cell_x = current_x; //单元格起始坐标
            current_x = cell_x + columnWidth; //下一个单元格的起始坐标
            return columnWidth;
        });
    }
}

function countFullWidthCharacters(str) {
    if (str === undefined) return 0;
    let fullWidthCount = 0;
    for (let i = 0; i < str.length; i++) {
        if (!str[i].match(/[\u0000-\u00ff]/g)) {
            fullWidthCount++;
        }
    }
    return fullWidthCount;
} // 计算全角字符的个数
