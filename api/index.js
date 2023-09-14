/**
 * @author Fred
 * @desc API实例列表
 */
import http from "http";
import app from "../components/myServer/index.js";
import "../components/myGarbageCollector/index.js";
import { onPostMessage } from "../components/myWebSocketClient/index.js";
import { onNewPDF } from "./taskPrinter/thePDFMaker.js";
import { onUpload } from "./taskPrinter/theUploader.js";
import { onNewPNG, onPrintPNG, onPrintNewPNG } from "./taskPrinter/thePNGMaker.js";
import { onPrinterInfo, onPrintPDF } from "./taskPrinter/theUSBPrinter.js";

import { onNewTask, onEndTask, onStartAllTasks, onGetAllTasks } from "./taskPLC/theTempPooling.js";
import { onReadQuery } from "./taskPLC/theTempSaver.js";

async function main() {
    app.all("/", (req, res) => {
        res.send("hello there!\n今天是" + new Date() + JSON.stringify(req.headers));
    });
    app.post("/api/plc/newTask", (req, res) => {
        onNewTask(req.body, (value) => res.json(value));
    });
    app.post("/api/plc/endTask", (req, res) => {
        onEndTask(req.body, (value) => res.json(value));
    });
    app.post("/api/plc/startAllTasks", (req, res) => {
        onStartAllTasks(req.headers, (value) => res.json(value));
    });
    app.get("/api/plc/getAllTasks", (req, res) => {
        onGetAllTasks(req.headers, (value) => res.json(value));
    });
    app.post("/api/plc/readQuery", (req, res) => {
        onReadQuery(req.body, (value) => res.json(value));
    });
    app.get("/api/printer/printerInfo", (req, res) => {
        onPrinterInfo(req.query, (value) => res.json(value));
    });
    app.post("/api/printer/uploadPDF", (req, res) => {
        onUpload(req.files, (value) => res.json(value));
    });
    app.post("/api/printer/makePDF", (req, res) => {
        onNewPDF(req.body, (value) => res.json(value));
    });
    app.post("/api/printer/printPDF", (req, res) => {
        onPrintPDF(req.body, (value) => res.json(value));
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
    });
    let httpServer = http.createServer(app);
    let PORT = global.envGetter("PORT") || 3000;
    httpServer.listen(PORT, () => console.log(`http enabled -- HTTP服务已启用: ${PORT}`));
}
main();
