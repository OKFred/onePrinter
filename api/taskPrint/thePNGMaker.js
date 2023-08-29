import fs from "fs";
import path from "path";
import * as pdf2img from "pdf-img-convert";
import { onPostMessage } from "../../components/myWebSocketClient/index.js";

export { onNewPNG, onPrintPNG };

// 创建PNG图片
async function onNewPNG({ relativePath = "", config } = {}, callbacks) {
    if (!relativePath) {
        callbacks?.({
            success: false,
            data: null,
            message: "参数错误",
        });
        return;
    }
    let absolutePath = path.join(process.cwd(), relativePath);
    if (
        !fs.existsSync(absolutePath) ||
        !absolutePath.startsWith(path.join(process.cwd(), "public"))
    ) {
        return callbacks?.({ success: false, data: null, message: "文件不存在" });
    } //检查最终路径是否在./public下，防止越权访问。
    let fileName = path.basename(absolutePath)?.replace(/\.pdf$/i, "");
    let imageBase = path.join(process.cwd(), "public", fileName);
    let result;
    try {
        let args = [absolutePath];
        if (config && typeof config === "object") args.push(config);
        let imageDataArr = await pdf2img.convert(...args);
        let i = 0;
        for (let imageData of imageDataArr) {
            fs.writeFileSync(imageBase + `_${i}.png`, imageData);
            i++;
        }
        result = "/public/" + fileName + `_0.png`;
    } catch (error) {
        console.log(error);
        result = error;
    }
    callbacks?.({
        success: result ? true : false,
        data: { relativePath: result },
        message: result ? "PNG文件已就位" : "PNG文件生成失败",
    });
}

// 打印PNG图片
async function onPrintPNG({ relativePath = "", config } = {}, callbacks) {
    if (!relativePath) {
        callbacks?.({
            success: false,
            data: null,
            message: "参数错误",
        });
        return;
    }
    let absolutePath = path.join(process.cwd(), relativePath);
    let fileBuffer = fs.readFileSync(absolutePath);
    let base64Data = fileBuffer.toString("base64");
    let imgSrcString = `data:image/png;base64,${base64Data}`;
    let obj = {
        model: "HM-A300",
        printerID: "CPCL",
        interface: "USB",
        printers: [
            {
                Items: [
                    {
                        itemtype: "CPCL_AddLabel",
                        offset: 0,
                        height: 400,
                        qty: 1,
                    },
                    {
                        itemtype: "CPCL_AddImage",
                        rotate: 0,
                        xPos: 100,
                        yPos: 100,
                        imagePath: imgSrcString,
                    },
                    {
                        itemtype: "CPCL_Print",
                    },
                ],
            },
        ],
    };
    if (config && config.quantity) obj.printers[0].Items[0].qty = config.quantity; //打印份数
    onPostMessage(obj, callbacks);
}
