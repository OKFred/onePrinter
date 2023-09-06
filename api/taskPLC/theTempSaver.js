import pool from "../../components/mySQL/index.js";

let _tableName = globalThis.envGetter("freezerTableName");
if (!_tableName) {
    console.log("请配置.env中的数据库表名(freezerTableName)");
    process.exit();
}

export { onWriteQuery, onReadQuery };

/**
 * @param {Object} dataObj
 * @param {String} dataObj.plcAddress PLC的IP地址
 * @param {Number} dataObj.rack 机架号
 * @param {Number} dataObj.slot 插槽号
 * @param {Number} dataObj.startByte 起始字节
 * @param {Number} dataObj.length 读取的长度
 * @param {Function} callbacks
 * @returns {Promise}
 */
async function onWriteQuery(dataObj = {}, callbacks) {
    // dataObj = { plcAddress: "127.0.0.1", rack: 16, slot: 1, startByte: 1400 };
    dataObj.queryTime = new Date().valueOf();
    let mapArr = [
        { label: "PLC的IP地址", key: "plcAddress" },
        { label: "机架号", key: "rack" },
        { label: "插槽号", key: "slot" },
        { label: "起始字节", key: "startByte" },
        { label: "温度", key: "temperature" },
        { label: "查询时间", key: "queryTime" },
    ];
    for (let i = 0; i < mapArr.length; i++) {
        let { key, value } = mapArr[i];
        if (String(value).isNull()) value = dataObj[key];
        if (String(value).isNull()) {
            return callbacks?.({ success: false, message: "参数错误, " + key + " 不能为空" });
        }
        mapArr[i].value = value;
    }
    let sqlKeys = mapArr.map((obj) => obj.key).join(",");
    let sqlKeyCount = mapArr.length;
    let sqlPlaceholder = "?,".repeat(sqlKeyCount).slice(0, -1);
    let sql = `INSERT INTO ${_tableName} (${sqlKeys}) VALUES (${sqlPlaceholder})`;
    let result = await pool.execute(
        sql,
        mapArr.map((obj) => obj.value),
    );
    let isSuccess = result[0].affectedRows === 1;
    callbacks?.({ success: isSuccess, message: isSuccess ? "写入成功" : "写入失败" });
    return isSuccess;
}

/**
 * @param {Object} dataObj
 * @param {Number} dataObj.queryTime 查询时间
 * @param {Number} dataObj.plcAddress 楼号
 * @param {Number} dataObj.rack 机架号
 * @param {Number} dataObj.slot 插槽号
 * @param {Number} dataObj.pageSize 每页条数
 * @param {Number} dataObj.pageNum 页码
 * @param {Function} callbacks
 * @returns {Promise}
 */
async function onReadQuery(
    {
        queryTime = 0,
        plcAddress = 0,
        rack = 0,
        slot = 0,
        startByte = 0,
        pageSize = 10,
        pageNum = 1,
    } = {},
    callbacks,
) {
    if (Number(pageSize) <= 0 || String(pageSize).isNull()) pageSize = 10;
    if (Number(pageNum) <= 0 || String(pageNum).isNull()) pageNum = 1;
    let sql;
    let sqlTotalCount;
    if (plcAddress) {
        sql = `SELECT * FROM  ${_tableName} WHERE plcAddress = ${plcAddress} ORDER BY queryTime DESC LIMIT ${pageSize} OFFSET ${
            (pageNum - 1) * pageSize
        }`;
        sqlTotalCount = `SELECT * FROM  ${_tableName} WHERE plcAddress = ${plcAddress} ORDER BY queryTime DESC`;
    } else if (rack && slot) {
        sql = `SELECT * FROM  ${_tableName} WHERE rack = ${rack} AND slot = ${slot} ORDER BY queryTime DESC LIMIT ${pageSize} OFFSET ${
            (pageNum - 1) * pageSize
        }`;
        sqlTotalCount = `SELECT * FROM  ${_tableName} WHERE rack = ${rack} AND slot = ${slot} ORDER BY queryTime DESC`;
    } else if (rack && slot && startByte) {
        sql = `SELECT * FROM  ${_tableName} WHERE rack = ${rack} AND slot = ${slot} AND startByte = ${startByte} ORDER BY queryTime DESC LIMIT ${pageSize} OFFSET ${
            (pageNum - 1) * pageSize
        }`;
        sqlTotalCount = `SELECT * FROM  ${_tableName} WHERE rack = ${rack} AND slot = ${slot} AND startByte = ${startByte} ORDER BY queryTime DESC`;
    } else if (queryTime) {
        sql = `SELECT * FROM  ${_tableName} WHERE queryTime = ${queryTime} ORDER BY queryTime DESC LIMIT ${pageSize} OFFSET ${
            (pageNum - 1) * pageSize
        }`;
        sqlTotalCount = `SELECT * FROM  ${_tableName} WHERE queryTime = ${queryTime} ORDER BY queryTime DESC`;
    } else {
        sql = `SELECT * FROM  ${_tableName} ORDER BY queryTime DESC LIMIT ${pageSize} OFFSET ${
            (pageNum - 1) * pageSize
        }`;
        sqlTotalCount = `SELECT * FROM  ${_tableName} ORDER BY queryTime DESC`;
    }
    let result = await pool.execute(sql);
    if (!result) return callbacks?.({ success: false, message: "查询失败" });
    let resultTotal = await pool.execute(sqlTotalCount);
    let total = Array.isArray(resultTotal[0]) ? resultTotal[0].length : 0;
    let records = result && Array.isArray(result[0]) ? result[0] : [];
    return callbacks?.({
        success: true,
        message: "查询成功",
        data: {
            records,
            pageSize,
            pageNum,
            total,
            size: result[0].length,
        },
    });
}
