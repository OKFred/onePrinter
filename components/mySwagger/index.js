import swaggerUi from "swagger-ui-express";

export default function ({ app, apiDocPath = "/openapi", swaggerOptions, PORT, rpcArr, tagArr }) {
    if (!swaggerOptions) {
        swaggerOptions = {
            openapi: "3.1.0",
            info: {
                title: "Printer API",
                version: "1.0.0",
                description: "打印PDF，适配斑马等支持IPP协议的打印机",
            },
            tags: tagArr,
            components: {
                securitySchemes: {
                    token: {
                        type: "apiKey",
                        name: "token",
                        in: "header",
                    },
                },
                schemas: {
                    默认返回格式: {
                        type: "object",
                        properties: {
                            ok: {
                                type: "boolean",
                            },
                            data: {
                                type: "object",
                            },
                            message: {
                                type: "string",
                            },
                        },
                    },
                },
            },
            security: [
                {
                    token: [],
                },
            ],
            paths: {},
        };
    }
    let pathsObj = {};
    rpcArr.forEach((obj) => {
        let { request, info } = obj;
        let { url, method = {}, headers, param } = request;
        method = method.toLowerCase();
        let methodObj = {
            tags: [info.tag],
            summary: info.name,
            responses: {
                200: {
                    description: "成功",
                },
            },
        };
        if (method === "get") {
            methodObj.parameters = param.map((item) => {
                return {
                    ...item,
                    in: method === "get" ? "query" : "body",
                    schema: {
                        ...item,
                    },
                    required: param.filter((item) => item.required).map((item) => item.name),
                };
            });
        } else {
            let contentType = headers?.["Content-Type"] || headers?.["content-type"];
            methodObj.requestBody = {
                content: {
                    [contentType]: {
                        //传递blob
                        schema: {
                            type: "object",
                            properties: param.reduce((prev, item) => {
                                prev[item.name] = {
                                    ...item,
                                };
                                return prev;
                            }, {}),
                            required: param
                                .filter((item) => item.required)
                                .map((item) => item.name),
                        },
                    },
                },
            };
        }
        if (!pathsObj[url]) pathsObj[url] = {};
        pathsObj[url][method] = methodObj;
    });
    swaggerOptions.paths = pathsObj;
    console.log("接口文档地址：", "http://127.0.0.1:" + PORT + apiDocPath);
    return app.use(apiDocPath, swaggerUi.serve, swaggerUi.setup(swaggerOptions));
}
