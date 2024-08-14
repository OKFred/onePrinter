import fs from "fs";
import path from "path";
import process from "process";
import mimeObj from "../../base/mimeMap.js";

export { onUpload };

async function onUpload(params, callbacks) {
    let urlArr = [];
    let { files } = params;
    for (let value of Object.values(files)) {
        let fileArr = Array.isArray(value) ? value : [value]; //兼容传多个文件的情况
        for (let fileObj of fileArr) {
            let { originalFilename, type } = fileObj;
            let fileNameWithoutExt = originalFilename.split(".")[0];
            let fileExtension = "";
            for (let [k, v] of Object.entries(mimeObj)) {
                if (type === v) {
                    fileExtension = k;
                    break;
                } //找到文件后缀名
            }
            if (!fileExtension) {
                let result = { message: "上传失败：文件格式有误", ok: false };
                return callbacks?.(result) || result;
            }
            let _relativePath = `/public/uploads/${fileNameWithoutExt}${fileExtension}`;
            // 实际是/public/，虚拟成/api/printer/public/
            let relativePath = _relativePath.replace(/^\/public\//g, "/api/printer/public/");
            let absolutePath = path.join(process.cwd(), _relativePath);
            urlArr.push(relativePath);
            fs.copyFile(fileObj["path"], absolutePath, (err) => {
                if (err) console.log(err);
            });
        }
    }
    console.log("已上传", urlArr.join("\n"));
    let result = { message: "上传成功", ok: true, data: urlArr };
    return callbacks?.(result) || result;
}
