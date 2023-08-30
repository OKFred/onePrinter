# 2023-08-30

# 引入node镜像
FROM node:16

# 在容器里创建一个目录
WORKDIR /app/nodeJS/printer

# 复制package.json文件到工作目录
COPY package.json ./

# 安装依赖
RUN npm install

# 复制所有文件到工作目录
COPY . .

# 设置环境变量
ENV PORT=9009
ENV WEBSOCKET_SERVER_URL=ws://127.0.0.1:9099/

# 暴露端口
EXPOSE 9009

# 项目启动
CMD ["npm", "run", "build"]
