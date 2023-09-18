import fs from "fs";
import path from "path";

//清理/public/uploads目录里的文件，.gitkeep和文件夹除外。
//清理/public目录里的文件，.gitkeep和文件夹除外。

//每周一1点清理
console.log("已引入垃圾回收器，将自动清理public下的文件");

async function main() {
    //检查今天是否是周一
    let timeDifference = await getTimeDifference();
    if (timeDifference < 0) {
        timeDifference += 7 * 24 * 60 * 60 * 1000; //如果今天是周一，那么下周一再清理
    }
    console.log("下次清理时间", new Date(Date.now() + timeDifference).toLocaleString());
    setInterval(cleanUp, timeDifference);
}
main();

async function cleanUp() {
    console.log(new Date().toLocaleString(), "开始GC");
    let whiteList = [".gitkeep"];
    let absolutePath = path.join(process.cwd(), "public");
    await removeFiles(absolutePath, whiteList);
    return true;
}

async function getTimeDifference() {
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
    return timeDifference;
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
