/**
 * @author Fred
 * @desc API实例列表
 */
import fs from "fs";
import http from "http";
import app from "../components/myServer/index.js";
import "../components/myGarbageCollector/index.js";
import swaggerMiddleware from "../components/mySwagger/index.js";
let rpcExampleStr = fs.readFileSync("./components/mySwagger/rpc.example.json");
let rpcStr = fs.readFileSync("./api/taskPrinter/rpc.json");
import { onUpload } from "./taskPrinter/theUploader.js";
import { onPrinterInfo, onPrintPDF } from "./taskPrinter/theUSBPrinter.js";
// import { onPostMessage } from "../components/myWebSocketClient/index.js";
// import { onNewPDF } from "./taskPrinter/thePDFMaker.js";
// import { onNewPNG, onPrintPNG, onPrintNewPNG } from "./taskPrinter/thePNGMaker.js";

async function main() {
    let rpcExampleArr = JSON.parse(rpcExampleStr);
    let rpcArr = JSON.parse(rpcStr);
    rpcArr = rpcArr.concat(rpcExampleArr);
    app.all("/", testHandler);
    let tagSet = new Set();
    for (let queryObj of rpcArr) {
        let { tag } = queryObj.info || {};
        if (tag) tagSet.add(tag);
        routerMaker(queryObj);
    }
    let tagArr = Array.from(tagSet);
    /*     app.all("/", (req, res) => {
        res.send("hello there!\n今天是" + new Date() + JSON.stringify(req.headers));
    });
    app.get("/api/printer/printerInfo", (req, res) => {
        onPrinterInfo(req.query, (value) => res.json(value));
    });
    app.post("/api/printer/uploadPDF", (req, res) => {
        onUpload(req.files, (value) => res.json(value));
    });
    app.post("/api/printer/printPDF", (req, res) => {
        onPrintPDF(req.body, (value) => res.json(value));
    }); */
    /*     app.post("/api/printer/makePDF", (req, res) => {
        onNewPDF(req.body, (value) => res.json(value));
    });
    app.post("/api/printer/makePNG", (req, res) => {
        onNewPNG(req.body, (value) => res.json(value));
    });
    app.post("/api/printer/printPNG", (req, res) => {
        onPrintPNG(req.body, (value) => res.json(value));
    });
    app.post("/api/printer/printNewPNG", (req, res) => {
        onPrintNewPNG(req.body, (value) => res.json(value));
    });
    app.post("/api/printer/postMessage", (req, res) => {
        onPostMessage(req.body, (value) => res.json(value));
    }); */
    let httpServer = http.createServer(app);
    let PORT = process.env["PORT"] || 3000;
    swaggerMiddleware({ app, apiDocPath: "/openapi", PORT, rpcArr, tagArr });
    httpServer.listen(PORT, () => console.log(`http enabled -- HTTP服务已启用: ${PORT}`));
}
function routerMaker(queryObj) {
    let { request, info } = queryObj;
    let { url, method, headers = {}, handlers } = request;
    method = method.toLowerCase();
    if (!Array.isArray(handlers)) handlers = [testHandler];
    handlers = handlers.map((fn, index) => {
        if (typeof fn === "string") {
            let [module_name, function_name] = fn.split(".");
            return async function (req, res) {
                await generalHandler(req, res, module_name, function_name);
            };
        }
        return fn;
    });
    app[method](url, ...handlers); //注册路由
}

function testHandler(req, res) {
    let responseData = {};
    if (req.method === "POST") {
        let contentType = req.headers["content-type"];
        for (let [key, value] of Object.entries(req.body)) {
            responseData[key] = value;
        }
        if (/form(-)?data/gi.test(contentType)) {
            let { files } = req;
            if (files) {
                for (let [key, value] of Object.entries(files)) {
                    let { name, size } = value;
                    responseData[key] = { name, size };
                }
            }
        }
    } else {
        responseData = req.query;
    }
    res.json({ message: "Hello World!", ok: true, data: responseData });
}

async function generalHandler(req, res, module_name, function_name) {
    try {
        let thisFn = await import(`./taskPrinter/${module_name}.js`);
        let { headers, files } = req;
        let params = (req.method === "GET" ? req.query : req.body) || {};
        params = { ...headers, ...params, files };
        let result = await thisFn[function_name](params);
        console.log(result);
        res.send(result || { ok: true, message: "运行成功", data: null });
    } catch (error) {
        console.log(error);
        res.json({ ok: false, message: error.message });
    }
}

main();
