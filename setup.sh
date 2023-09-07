echo $(Date);
echo 'ubuntu下环境自动配置中，因为node-snap7存在依赖';
echo '记得配置端口转发，PLC端口默认 102 (TCP)'
apt install make
apt install g++
npm i
echo '请将文件夹放置于/home/zq/WorkSpace/NodeJS/'
echo '或者手动修改/etc/systemd/system/zq_nodeJS_onePrinter.service'
cp zq_nodeJS_onePrinter.service  /etc/systemd/system/zq_nodeJS_onePrinter.service
systemctl daemon-reload
systemctl restart zq_nodeJS_onePrinter
systemctl status zq_nodeJS_onePrinter