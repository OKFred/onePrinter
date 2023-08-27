/**
 * @author Fred
 * @desc fetch网络请求封装
 * @since 2023-02-22 18:27:00
 */

/**
 * @desc 依赖检查
 * @return {object} fetch - fetch对象
 * */
(async function selfCheck() {
    if (typeof fetch !== "undefined") return fetch;
    let _fetch;
    try {
        _fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
    } catch (e) {
        return console.log(`服务器环境将使用node-fetch模块，请先安装: npm i node-fetch\n
    `); //node 自带的fetch还待完善，存在set-cookie读取问题，等LTS先 https://github.com/nodejs/undici/issues/1616
    }
    console.log("node-fetch模块已全局加载", _fetch);
    globalThis.fetch = _fetch; //全局注入fetch对象
    return _fetch;
})();

/**
 * @desc 发起网络请求
 * @param {object} queryObj - 请求对象
 * @param {string} url - 请求地址(可选)
 * @return {object} res - 响应对象
 * @example
 * let queryObj={request:{url:"https://example.com/list",header:{method:"GET",data:{currentPage:1}}},response:{data:{}},info:{}};
 * doFetch(queryObj).then((res)=>console.log(res));
 * */
async function doFetch(queryObj, url) {
    if (!queryObj || !queryObj.request) return queryObj;
    if (!url) url = queryObj.request.url;
    if (
        queryObj.request.header.method === "GET" &&
        !/\?/.test(url) &&
        queryObj.request.data &&
        Object.keys(queryObj.request.data).length
    ) {
        url = url + "?" + objToParam(queryObj.request.data, url);
    }
    queryObj.request.url = url;
    queryObj = await headerMaker(queryObj); // request header
    let header = queryObj.request.header;
    let fetching;
    try {
        fetching = await fetch(url, header);
    } catch (e) {
        console.log("network error--网络异常", e);
        return queryObj;
    } // pending resolve
    let res = headerReceiver(queryObj, fetching); // response header
    let data;
    try {
        data = await fetching.text();
        data = JSON.parse(data);
    } catch (e) {}
    // console.log(data);
    res.response.data = data;
    res = redirectionCheck(res);
    return res;
}

/**
 * @desc 重定向检查
 * @param {object} res - 响应对象
 * @return {object} res - 响应对象
 * */
async function redirectionCheck(res) {
    // 需求：拿到重定向URL 或 置空
    let redirectSetting = res.request.header.redirect;
    let redirectURL;
    let { net } = res.response;
    if (!redirectSetting) redirectSetting = "follow";
    if (redirectSetting === "follow") {
        if (net.redirected) redirectURL = net.url;
    } else if (redirectSetting === "manual") {
        if (typeof window !== "undefined") {
            if ((!net.status && !res.response.data) || net.type === "opaqueredirect") {
                redirectURL = true;
            } // 前端自动(follow)跳转才能得到重定向URL
        } else {
            if (net.status > 299 && net.status < 400) {
                if (res.response.headers.location) redirectURL = res.response.headers.location;
            }
        } // 重定向可能需要cookies等配合，后端没有缓存，所以每跳转一次需重新设置(manual)
    }
    res.response.redirectURL = redirectURL;
    return res;
}

/**
 * @desc 生成请求头
 * @param {object} queryObj - 请求对象
 * @return {object} queryObj - 请求对象
 * */
async function headerMaker(queryObj) {
    let header = queryObj.request.header;
    if (!header.headers) header.headers = {};
    if (!header.credentials || header.credentials !== "omit") {
        let allCookieObj = queryObj.response.allCookieObj;
        if (allCookieObj) queryObj = cookieGetter(queryObj); // node-fetch
    } // 生成所需的 cookieObj
    if (queryObj.request.cookieObj) {
        let cookie = "";
        for (let [cookieName, detailObj] of Object.entries(queryObj.request.cookieObj)) {
            cookie += cookieName + "=" + detailObj.value + "; ";
        } // 转化为 cookie 字符串， append
        cookie = cookie.replace(/; $/, "");
        if (!header.headers.cookie) header.headers.cookie = "";
        header.headers.cookie += cookie;
    }
    if (header.method === "GET") return queryObj;
    let contentType = header.headers["Content-Type"] || header.headers["content-type"];
    if (/json/i.test(contentType)) {
        header.body = JSON.stringify(queryObj.request.data);
    } else if (/urlencoded/i.test(contentType)) {
        header.body = objToParam(queryObj.request.data);
    } else if (/form(-)?data/gi.test(contentType)) {
        let bodyData;
        if (queryObj.request.data instanceof FormData) {
            bodyData = queryObj.request.data;
        } else {
            bodyData = new FormData();
            for (let [k, v] of Object.entries(queryObj.request.data)) {
                if (typeof v !== "object" || v instanceof Blob) {
                    bodyData.set(k, v);
                } /* else if (v == "$$blob") {
                        // extension 浏览器插件前后台数据传递，需要做下兼容，blob→formData:
                        let file = queryObj.request.file;
                        let data = await fetch(file.url);
                        let blobData = await data.blob();
                        queryObj.request.file.size = blobData.size;
                        bodyData.set(k, blobData, file.name);
                    } */ else {
                    bodyData.set(k, JSON.stringify(v));
                }
            }
        }
        header.body = bodyData;
    }
    return queryObj;
}

/**
 * @desc 生成响应头
 * @param {object} res - 响应对象
 * @param {object} fetching - fetch响应对象
 * @return {object} res - 响应对象
 * */
function headerReceiver(res, fetching) {
    let headerObj = {};
    let { redirected, status, statusText, ok } = fetching;
    let origin = new URL(fetching.url).origin;
    res.response.net = {
        redirected,
        status,
        statusText,
        ok,
        origin,
        url: fetching.url,
    };
    if (fetching.headers.raw) {
        headerObj = fetching.headers.raw(); // 兼容node-fetch
        for (let [k, v] of Object.entries(headerObj)) {
            headerObj[k] = v.join("\n");
        }
    } else {
        for (let [k, v] of fetching.headers.entries()) {
            headerObj[k] = v;
        }
    }
    res.response.headers = headerObj;
    if (headerObj["set-cookie"]) res = cookieSetter(res); // node-fetch
    return res;
}

/**
 * @desc node-fetch 历史cookie读取并附在请求头(后端)
 * @env server
 * @param {object} queryObj - 请求对象
 * @return {object} queryObj - 请求对象
 * */
function cookieGetter(queryObj) {
    let allCookieObj = queryObj.response.allCookieObj;
    let cookieObj = queryObj.request.cookieObj ? queryObj.request.cookieObj : {};
    let found = false;
    let reqDomain = new URL(queryObj.request.url).host;
    let reqPath = new URL(queryObj.request.url).pathname;
    let { domainMain, domainSub } = domainChecker(reqDomain);
    if (allCookieObj[domainMain] === undefined) return queryObj;
    if (allCookieObj[domainMain][domainSub] === undefined) return queryObj;
    for (let [path, target] of Object.entries(allCookieObj[domainMain][domainSub])) {
        if (reqPath.match(path)) {
            found = true;
            Object.assign(cookieObj, target);
        }
    }
    if (!found) return queryObj;
    if (domainSub !== "www") {
        if (allCookieObj[domainMain]["www"] && allCookieObj[domainMain]["www"]["/"]) {
            Object.assign(cookieObj, allCookieObj[domainMain]["www"]["/"]);
        }
    }
    queryObj.request.cookieObj = cookieObj;
    return queryObj;
}

/**
 * @desc node-fetch 请求得到的set-cookie读取并存为对象(后端)
 * @env server
 * @param {object} res - 响应对象
 * @return {object} res - 响应对象
 * */
function cookieSetter(res) {
    let allCookieObj = res.response.allCookieObj || {}; // 读取现有 cookie or 重置
    let resCookie = res.response.headers["set-cookie"].split("\n");
    let resDomain = new URL(res.response.net.url).host;
    let cookieObj = {};
    resCookie.forEach((cookieString) => {
        let cookieInfo = cookieString.split(";");
        // extract cookie name, value, and extra data
        let cookieBody = cookieInfo[0].split("=");
        let [cookieName, ...valueArr] = cookieBody;
        let name = cookieName.trim();
        let value = valueArr.join("="); // 需要考虑值包含多个等号的情况
        cookieObj[name] = {};
        cookieObj[name].value = value;
        for (let i = 1; i < cookieInfo.length; i++) {
            let cookieBody = cookieInfo[i].split("=");
            let [name, ...valueArr] = cookieBody;
            name = name.trim();
            let value = valueArr.join("=");
            cookieObj[cookieName][name] = value;
        } // extract domain & sub-domain & path
        let domain = cookieInfo.find((str) => !!str.match(/Domain=/gi));
        domain = domain ? domain.replace(/Domain=(\.)?/gi, "").trim() : resDomain;
        let { domainMain, domainSub } = domainChecker(domain);
        let path = cookieInfo.find((str) => !!str.match(/Path=/gi));
        path = path
            ? path.replace(/.*Path=(.*)/gi, (match, p1) => {
                  if (p1 === "/") return p1;
                  return p1.replace(/\/$/, ""); // 去掉末尾的"/"
              })
            : "/";
        if (allCookieObj[domainMain] === undefined) allCookieObj[domainMain] = {};
        if (allCookieObj[domainMain][domainSub] === undefined) {
            allCookieObj[domainMain][domainSub] = {};
        }
        if (allCookieObj[domainMain][domainSub][path] === undefined) {
            allCookieObj[domainMain][domainSub][path] = {};
        }
        Object.assign(allCookieObj[domainMain][domainSub][path], cookieObj);
    });
    res.response.cookieObj = cookieObj;
    res.response.allCookieObj = allCookieObj;
    return res;
}

/**
 * @desc 提取域名信息
 * @param {string} domain - 域名
 * @return {object} domainInfo - 域名信息
 * @return {string} domainInfo.domainMain - 主域名
 * @return {string} domainInfo.domainSub - 子域名
 * @example
 * domainChecker("new.example.com") => { domainMain: "example.com", domainSub: "new" }
 * */
function domainChecker(domain) {
    let domainInfo = domain.split(".");
    let domainMain = domainInfo[domainInfo.length - 2] + "." + domainInfo[domainInfo.length - 1];
    domainInfo.pop();
    domainInfo.pop();
    let domainSub = domainInfo.join(".") || "www";
    return { domainMain, domainSub };
}

/**
 * @desc 对象转参数
 * @param {object} obj - 对象
 * @return {string} param - 参数
 * */
function objToParam(obj) {
    let arr = [];
    for (let [k, v] of Object.entries(obj)) {
        if (typeof v === "object") {
            arr.push(encodeURIComponent(k) + "=" + encodeURIComponent(JSON.stringify(v)));
        } else {
            if (v !== undefined) arr.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
    }
    return arr.join("&");
}

/**
 * @desc URL转对象
 * @param {string} url - URL
 * @return {object} obj - 对象
 * */
function paramToObj(url) {
    let params = new URL(url).searchParams;
    let obj = {};
    for (let [k, v] of params.entries()) {
        obj[k] = v;
    }
    return obj;
}

/**
 * @desc 模拟异步请求
 * @param {number} milsec - 毫秒数
 * @return {Promise} - Promise对象
 * */
async function sleep(milsec) {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(resolve, milsec);
        } catch (error) {
            console.log(error);
            return reject(null);
        }
    }).catch((e) => {
        console.log(e);
        return false;
    });
}

/**
 * @desc 查询接口信息
 * @param {string} What - 接口名
 * @param {array} rpc - 接口信息数组
 * @return {object} queryObj - 接口信息对象
 * */
function prepareMsg(What = "", rpc = []) {
    let queryObj = rpc.find((obj) => obj.info.index === What);
    if (!queryObj) return console.log("⚠️找不到对应的接口", What);
    queryObj = JSON.parse(JSON.stringify(queryObj)); //深拷贝
    return queryObj;
}

function uaMaker(queryObj) {
    let { url = "", header = {} } = queryObj.request;
    if (!header.headers) header.headers = {};
    let origin, referer;
    origin = referer = new URL(url).origin;
    header.headers["Origin"] = origin;
    header.headers["Referer"] = referer;
    header.headers["Referrer"] = referer;
    header.headers[
        "User-Agent"
    ] = `Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1`;
    return queryObj;
}

export default doFetch;
export { doFetch, objToParam, paramToObj, sleep, prepareMsg, uaMaker };
