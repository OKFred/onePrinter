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
ENV printerURL=http://127.0.0.1:631/printers/xxx
ENV PORT=9009
ENV sessionSecret=mysession

# 仅限汉印打印机 👇
## 打印机语言
ENV printerID=CPCL
## 纸张大小设置
ENV printerPaperWidth=80
ENV printerPaperHeight=50

# 暴露端口
#EXPOSE 9009

# 项目启动
CMD ["npm", "run", "build"]
