# 2023-08-30

# 引入node镜像
FROM node:16

# 在容器里创建一个目录
WORKDIR /app/nodeJS/

# 复制package.json文件到工作目录
COPY package.json ./

# 安装依赖
RUN apt update
RUN apt install make
RUN apt install g++

RUN npm install

# 复制所有文件到工作目录
COPY . .

# 设置环境变量
ENV PORT=9009
ENV WEBSOCKET_SERVER_URL=ws://127.0.0.1:9099/

ENV printerID=CPCL

# 纸张大小设置
ENV printerPaperWidth=80
ENV printerPaperHeight=50

# 冷库数据库
ENV MYSQL_HOST=127.0.0.1
ENV MYSQL_USER=root
ENV MYSQL_PASSWORD=abc
ENV MYSQL_DATABASE=dev
ENV freezerTableName=tonghai_operations
ENV freezerTaskToken=666


# 暴露端口
#EXPOSE 9009

# 项目启动
CMD ["npm", "run", "build"]
