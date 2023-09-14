import fs from "fs";
import path from "path";

//清理/public/uploads目录里的文件，.gitkeep和文件夹除外。
//清理/public目录里的文件，.gitkeep和文件夹除外。

//每周一1点清理
console.log("已引入垃圾回收器，将自动清理public下的文件");
setTimeout(main, 10000); //项目启动10秒后开始执行
async function main() {
    let whiteList = [".gitkeep"];
    let absolutePath = path.join(process.cwd(), "public");
    await removeFiles(absolutePath, whiteList);
    let timeNow = new Date();
    let timeNextMondayAt1am = new Date(
        timeNow.getFullYear(),
        timeNow.getMonth(),
        timeNow.getDate() + ((1 + 7 - timeNow.getDay()) % 7),
        1,
        0,
        0,
    );
    let timeDifference = timeNextMondayAt1am - timeNow;
    console.log("下次计划清理时间：", timeNextMondayAt1am.toLocaleString());
    setTimeout(main, timeDifference);
}

async function removeFiles(absolutePath, whiteList) {
    if (!fs.existsSync(absolutePath)) {
        return console.log("目录不存在");
    }
    let fileArr = fs.readdirSync(absolutePath);
    fileArr.forEach((item) => {
        let fileType = fs.lstatSync(path.join(absolutePath, item)).isDirectory();
        if (fileType) {
            removeFiles(path.join(absolutePath, item), whiteList);
        } else {
            if (!whiteList.includes(item)) {
                fs.unlinkSync(path.join(absolutePath, item));
            }
        }
    });
    console.log(new Date().toLocaleString(), "完成GC", absolutePath);
    return true;
}
