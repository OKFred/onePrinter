# 打印机接口

## 测试

方法：ALL
路径：/

## 获取打印机信息

方法：GET
路径：/api/printer/printerInfo
出参：{} 打印机信息对象

## 生成 PDF 文件，准备打印预览

方法：POST
路径：/api/printer/makePDF
入参：{ textArr = [] } 打印文本对象
出参：pdf 文件路径 { relativePath: 'xxx.pdf' }

## 打印 PDF 文件

方法：POST
路径：/api/printer/printPDF
入参：pdf 文件路径 { relativePath: 'xxx.pdf' }
出参：打印任务对象 {}

## 生成 PNG 文件，准备打印图片

方法：POST
路径：/api/printer/makePNG
入参：{ relativePath = "" } PDF 文件路径
出参：PNG 文件路径 { relativePathArr: ['xxx_1.png', 'xxx_2.png'] }

## 打印 PNG 文件

方法：POST
路径：/api/printer/printPNG
入参：PNG 文件路径 { relativePathArr: ['xxx_1.png', 'xxx_2.png'] }
出参：打印任务对象 {}

## 打印 PNG 文件

方法：POST
路径：/api/printer/printPNG
入参：PNG 文件路径 { relativePath: 'xxx.png' }
出参：打印任务对象 {}
