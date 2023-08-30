import fs from "fs";
import path from "path";
import * as pdf2img from "pdf-img-convert";
import { onPostMessage } from "../../components/myWebSocketClient/index.js";

export { onNewPNG, onPrintPNG, onPrintNewPNG };

// 创建PNG图片
async function onNewPNG({ relativePath = "", config = {} } = {}, callbacks) {
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
    if (typeof config !== "object") {
        try {
            config = JSON.parse(config);
        } catch (e) {
            config = {};
        }
    }
    try {
        let args = [absolutePath];
        if (Object.keys(config).length > 0) args.push(config);
        let imageDataArr = await pdf2img.convert(...args);
        let i = 0;
        result = [];
        if (config.base64) {
            for (let imageData of imageDataArr) {
                result.push(imageData);
                i++;
            }
        } else {
            for (let imageData of imageDataArr) {
                fs.writeFileSync(imageBase + `_${i}.png`, imageData);
                result.push("/public/" + fileName + `_${i}.png`);
                i++;
            }
        }
    } catch (error) {
        console.log(error);
        result = error;
    }
    callbacks?.({
        success: result ? true : false,
        data: { relativePathArr: result },
        message: result ? "PNG文件已就位" : "PNG文件生成失败",
    });
    return result;
}

// 打印PNG图片
async function onPrintPNG({ base64, relativePath = "", config = {} } = {}, callbacks) {
    if (!relativePath && !base64) {
        callbacks?.({
            success: false,
            data: null,
            message: "参数错误",
        });
        return;
    }
    if (!base64) {
        let absolutePath = path.join(process.cwd(), relativePath);
        let fileBuffer = fs.readFileSync(absolutePath);
        base64 = fileBuffer.toString("base64");
    }
    let imageString = `data:image/png;base64,${base64}`;
    let obj = {
        model: "HT300",
        printerID: "TSPL",
        interface: "USB",
        printers: [
            {
                Items: [
                    {
                        itemtype: "TSPL_ClearBuffer",
                    },
                    {
                        itemtype: "TSPL_Setup",
                        labelWidth: 80,
                        labelheight: 50,
                        speed: 2,
                        density: 6,
                        type: 1,
                        gap: 0,
                        offset: 0,
                    },
                    {
                        itemtype: "TSPL_BitMap",
                        xPos: 0,
                        yPos: 0,
                        mode: 0,
                        fileName: imageString,
                    },
                    {
                        itemtype: "TSPL_Print",
                        num: 1,
                        copies: 1,
                    },
                ],
            },
        ],
    };
    if (typeof config !== "object") {
        try {
            config = JSON.parse(config);
        } catch (e) {
            config = {};
        }
    }
    if (config.quantity) obj.printers[0].Items[2].copies = config.quantity; //打印份数
    return await onPostMessage(obj, callbacks);
}

async function onPrintNewPNG({ relativePath = "", config = {} } = {}, callbacks) {
    if (typeof config !== "object") {
        try {
            config = JSON.parse(config);
        } catch (e) {
            config = {};
        }
    }
    config.base64 = true;
    let base64Arr = await onNewPNG({ relativePath, config });
    if (!base64Arr || !base64Arr.length) {
        return callbacks?.({ success: false, data: null, message: "打印失败" });
    }
    let try_count = 0;
    let success_count = 0;
    let _callbacks = ({ success }) => {
        if (success) success_count++;
    };
    for (let base64 of base64Arr) {
        try_count++;
        await onPrintPNG({ base64, config }, _callbacks);
    }
    if (success_count === 0) return callbacks({ success: false, message: "打印任务失败" });
    else if (success_count < try_count) {
        return callbacks({ success: false, message: "部分打印任务失败" });
    }
    return callbacks({ success: false, message: "打印任务成功" });
}
