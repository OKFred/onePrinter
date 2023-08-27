/**
 * @author Fred
 * @desc 实例列表
 */
import http from "http";
import app from "../components/myServer/index.js";
import { onNewPDF } from "./taskPrint/thePDFMaker.js";
import { onPrinterInfo, onPrintPDF } from "./taskPrint/theUSBPrinter.js";


async function main() {
    app.all("/", (req, res) => res.send("hello there!"));
    app.get("/api/printer/printerInfo", (req, res) =>
        onPrinterInfo(req.query, (value) => res.json(value)),
    );
    app.post("/api/printer/makePDF", (req, res) => onNewPDF(req.body, (value) => res.json(value)));
    app.post("/api/printer/printPDF", (req, res) =>
        onPrintPDF(req.body, (value) => res.json(value)),
    );
    let httpServer = http.createServer(app);
    let PORT = global.envGetter("PORT") || 3000;
    httpServer.listen(PORT, () => console.log(`http enabled -- HTTP服务已启用: ${PORT}`));
}
main();
