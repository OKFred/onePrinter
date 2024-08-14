# 支持IPP协议的打印机API

## 测试

方法：ALL

路径：/

## 获取打印机信息

方法：GET

路径：/api/printer/printerInfo

入参：null

出参：{ "message": "", "ok": "" }

## 生成 PDF 文件，准备打印预览

方法：POST

路径：/api/printer/makePDF

入参：{ "textArr" : [] } 打印文本对象

出参：{ "data": { "relativePath": "" }, "message": "", "ok": "" }

## 打印 PDF 文件

方法：POST

路径：/api/printer/printPDF

入参： { "relativePath": "" } pdf 文件路径

出参：{ "message": "", "ok": "" }

## 生成 PNG 文件，准备打印图片

方法：POST

路径：/api/printer/makePNG

入参：{ "relativePath" : "" } PDF 文件路径

出参：{ data: { "relativePathArr": [] }, "message": "", "ok": "" }

## 打印 PNG 文件

方法：POST

路径：/api/printer/printPNG

入参： { "relativePathArr": [] } PNG 文件路径

出参：{ "data": [], "message": "", "ok": "" } 任务列表

## 打印 PNG 文件

方法：POST

路径：/api/printer/printPNG

入参： { "relativePath": "" } PNG 文件路径

出参：{ "data": [], "message": "", "ok": "" } 任务列表
