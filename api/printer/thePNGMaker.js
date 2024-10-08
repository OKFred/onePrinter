import fs from "fs";
import path from "path";
import * as pdf2img from "pdf-img-convert";
import { onPostMessage } from "../../components/myWebSocketClient/index.js";

let printerID = process.env["printerID"];

export { onNewPNG, onPrintPNG, onPrintNewPNG };

// 创建PNG图片
async function onNewPNG({ relativePath = "", config = {} } = {}, callbacks) {
    if (!relativePath) {
        callbacks?.({
            ok: false,
            data: null,
            message: "参数错误",
        });
        return;
    }
    //虚拟是/api/printer/public/，实际是/public/
    let _relativePath = relativePath.replace(/^\/api\/printer\/public\//g, "/public/");
    let absolutePath = path.join(process.cwd(), _relativePath);
    if (
        !fs.existsSync(absolutePath) ||
        !absolutePath.startsWith(path.join(process.cwd(), "public"))
    ) {
        return callbacks?.({ ok: false, data: null, message: "文件不存在" });
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
                result.push("/api/printer/public/" + fileName + `_${i}.png`);
                i++;
            }
        }
    } catch (error) {
        console.log(error);
        result = error;
    }
    callbacks?.({
        ok: result ? true : false,
        data: { relativePathArr: result },
        message: result ? "PNG文件已就位" : "PNG文件生成失败",
    });
    return result;
}

// 打印PNG图片
async function onPrintPNG({ base64, relativePath = "", config = {} } = {}, callbacks) {
    if (!relativePath && !base64) {
        callbacks?.({
            ok: false,
            data: null,
            message: "参数错误",
        });
        return;
    }
    if (!base64) {
        //虚拟是/api/printer/public/，实际是/public/
        let _relativePath = relativePath.replace(/^\/api\/printer\/public\//g, "/public/");
        let absolutePath = path.join(process.cwd(), _relativePath);
        let fileBuffer = fs.readFileSync(absolutePath);
        base64 = fileBuffer.toString("base64");
    }
    let imageString = `data:image/png;base64,${base64}`;
    let obj;
    if (printerID === "TSPL") {
        obj = {
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
    } else if (printerID === "CPCL") {
        obj = {
            model: "HM-A300",
            printerID: "CPCL",
            interface: "USB",
            printers: [
                {
                    Items: [
                        {
                            itemtype: "CPCL_AddLabel",
                            offset: 0,
                            height: 500,
                            qty: 1,
                        },
                        {
                            itemtype: "CPCL_AddImage",
                            rotate: 0,
                            xPos: 0,
                            yPos: 0,
                            imagePath: imageString,
                        },
                        {
                            itemtype: "CPCL_Print",
                        },
                    ],
                },
            ],
        };
    } else {
        callbacks?.({
            ok: false,
            data: null,
            message: "未定义打印语言",
        });
        return;
    }
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
        return callbacks?.({ ok: false, data: null, message: "打印失败" });
    }
    let try_count = 0;
    let success_count = 0;
    let _callbacks = ({ ok }) => {
        if (ok) success_count++;
    };
    for (let base64 of base64Arr) {
        try_count++;
        await onPrintPNG({ base64, config }, _callbacks);
    }
    if (success_count === 0) return callbacks({ ok: false, message: "打印任务失败" });
    else if (success_count < try_count) {
        return callbacks({ ok: false, message: "部分打印任务失败" });
    }
    return callbacks({ ok: true, message: "打印任务成功" });
}
