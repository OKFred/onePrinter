# 打印机接口

## 测试
方法：ALL 
路径：/  

## 获取打印机信息
方法：GET 
路径：/api/printer/printerInfo
出参：Object(打印机信息)

## 生成PDF文件，准备打印预览
方法：POST
路径：/api/printer/makePDF
入参：String(打印内容)[]
出参：pdf文件路径

## 打印PDF文件
方法：POST
路径：/api/printer/printPDF
入参：Object(pdf文件路径)
出参：Object(打印结果)
