# Siemens 西门子S7-200 SMART PLC 接口

## 测试

方法：ALL

路径：/

## 新建 PLC 轮询任务

方法：POST

路径：/api/plc/newTask

入参：{ "plcAddress" : "", "rack" : "", "slot" : "", "startByte": "" } 任务对象

出参：{ "message": "", "success": "" }

## 结束 PLC 轮询任务

方法：POST

路径：/api/plc/endTask

入参：{ "key": "" } 任务 ID

出参：{ "message": "", "success": "" }

## 批量创建 PLC 轮询任务

POST

路径：/api/plc/startAllTasks

入参：{ "token": "" } 令牌(headers)

出参：{ "message": "", "success": "" } 任务列表

## 获取 PLC 轮询任务列表

方法：GET

路径：/api/plc/getAllTasks

入参：{ "token": "" } 令牌(headers)

出参：{ "data": [], "message": "", "success": "" } 任务列表

## 获取 PLC 轮询任务结果

方法：POST

路径：/api/plc/readQuery

入参：{ "queryTime": "", "plcAddress": "", "rack": "", "slot": "", "startByte": "", "pageSize": "" , "pageNum": "" } 任务 ID

出参：{ "data": { "records":[], "total": "" }, "message": "", "success": "" } 温度列表

# HPRT 汉印 D35/N41 打印机接口

## 获取打印机信息

方法：GET

路径：/api/printer/printerInfo

入参：null

出参：{ "message": "", "success": "" }

## 生成 PDF 文件，准备打印预览

方法：POST

路径：/api/printer/makePDF

入参：{ "textArr" : [] } 打印文本对象

出参：{ "data": { "relativePath": "" }, "message": "", "success": "" }

## 打印 PDF 文件

方法：POST

路径：/api/printer/printPDF

入参： { "relativePath": "" } pdf 文件路径

出参：{ "message": "", "success": "" }

## 生成 PNG 文件，准备打印图片

方法：POST

路径：/api/printer/makePNG

入参：{ "relativePath" : "" } PDF 文件路径

出参：{ data: { "relativePathArr": [] }, "message": "", "success": "" }

## 打印 PNG 文件

方法：POST

路径：/api/printer/printPNG

入参： { "relativePathArr": [] } PNG 文件路径

出参：{ "data": [], "message": "", "success": "" } 任务列表

## 打印 PNG 文件

方法：POST

路径：/api/printer/printPNG

入参： { "relativePath": "" } PNG 文件路径

出参：{ "data": [], "message": "", "success": "" } 任务列表
