import fs from "fs";
import path from "path";
import process from "process";
import mimeObj from "../../base/mimeMap.js";

export { onUpload };

async function onUpload(data, callbacks) {
    let urlArr = [];
    for (let value of Object.values(data)) {
        let fileArr = Array.isArray(value) ? value : [value]; //兼容传多个文件的情况
        for (let fileObj of fileArr) {
            let { originalFilename, type } = fileObj;
            let fileExtension = "";
            for (let [k, v] of Object.entries(mimeObj)) {
                if (type === v) {
                    fileExtension = k;
                    break;
                } //找到文件后缀名
            }
            if (!fileExtension) {
                return callbacks?.({ message: "上传失败：文件格式有误", success: false });
            }
            let _relativePath = `/public/uploads/${originalFilename}${fileExtension}`;
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
    callbacks?.({ message: "上传成功", success: true, data: urlArr });
}
