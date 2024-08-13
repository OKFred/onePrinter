import swaggerUi from "swagger-ui-express";

export default function ({ app, apiDocPath = "/openapi", swaggerOptions, rpcArr, tagArr }) {
    if (!swaggerOptions) {
        swaggerOptions = {
            openapi: "3.0.0",
            info: {
                title: "接口文档",
                version: "1.0.0",
                description: "swagger接口文档",
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
                            success: {
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
        let { url, header = {}, param } = request;
        let method = header.method.toLowerCase();
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
                        type: item.type,
                    },
                };
            });
        } else if (method === "post") {
            let contentType = header.headers?.["Content-Type"];
            methodObj.requestBody = {
                content: {
                    [contentType]: {
                        //传递blob
                        schema: {
                            type: "object",
                            properties: param.reduce((prev, item) => {
                                prev[item.name] = {
                                    type: item.type,
                                };
                                return prev;
                            }, {}),
                        },
                    },
                },
            };
        }
        if (!pathsObj[url]) pathsObj[url] = {};
        pathsObj[url][method] = methodObj;
    });
    swaggerOptions.paths = pathsObj;
    console.log("接口文档地址：", apiDocPath);
    return app.use(apiDocPath, swaggerUi.serve, swaggerUi.setup(swaggerOptions));
}
