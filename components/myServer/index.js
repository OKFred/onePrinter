//外部模块
import express, { json, urlencoded } from "express";
import session from "express-session";
import expressFormData from "express-form-data";

//配置 Express http 服务器
let app = express();
let sessionMiddleware = session({
    secret: global.envGetter("sessionSecret") || "secret",
    cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: false, sameSite: false },
    saveUninitialized: false,
    resave: true,
    rolling: true,
    proxy: true,
}); //启用session

app.use(
    "/public",
    express.static("public", {
        setHeaders: function (res, path, stat) {
            res.set("Access-Control-Allow-Origin", "*");
        },
    }),
); //跨域
app.use(json()); //接收 POST 必备
app.use(urlencoded({ extended: true }));
app.use(expressFormData.parse());
app.use(sessionMiddleware);
app.disable("x-powered-by");
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "*");
    next();
}); //跨域

export default app;
