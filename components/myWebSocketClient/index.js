import WebSocket from "websocket";

// WebSocket 服务器地址
let serverUrl = globalThis.envGetter("WEBSOCKET_SERVER_URL");

// 连接到 WebSocket 服务器
async function onPostMessage(obj, callbacks) {
    // 创建 WebSocket 客户端
    let ws = new WebSocket.client();
    setTimeout(() => ws.connect(serverUrl, null), 0);
    let connection = await new Promise((resolve, reject) => {
        ws.on("connect", (connection) => {
            connection.on("error", (error) => error && resolve(false));
            // console.log("连接已建立!"+ serverUrl);
            resolve(connection);
            // 监听消息事件
        });
        ws.on("close", (reasonCode, description) => {
            console.log("连接失败: " + reasonCode, description);
            resolve(false);
        });
    });
    if (!connection) return callbacks?.({ success: false, message: "连接失败" });
    let str;
    try {
        if (obj.printers && !Array.isArray(obj.printers)) obj.printers = JSON.parse(obj.printers);
        str = decodeURIComponent(JSON.stringify(obj));
    } catch (error) {
        callbacks?.({ success: false, message: "消息格式错误" });
    }
    setTimeout(() => connection.sendUTF(str), 0);
    console.log("发送消息：", str?.length);
    let result = await new Promise((resolve, reject) => {
        connection.on("message", (message) => {
            let obj;
            if (message.type === "utf8") {
                obj = message.utf8Data;
            }
            try {
                obj = JSON.parse(obj);
            } catch (error) {
                obj = false;
            }
            return resolve(obj);
        });
    });
    // console.log("发送成功，收到回复消息后将主动断开网络...");
    connection.close();
    callbacks?.({
        success: result ? true : false,
        data: { ...result },
        message: result ? "消息已发送" : "消息发送失败",
    });
}

export { onPostMessage };
