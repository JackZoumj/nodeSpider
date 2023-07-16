# nodeSpider details
项目名称：网络数据爬取与持久化存储
项目描述：该项目旨在使用Node.js相关技术，实现对网络数据的爬取并将其持久化存储到数据库中。通过构建一个轻量级服务器，为前端提供REST风格的接口，实现对爬取数据的访问和操作。
项目内容：
1、通过Axios库发送网络请求，获取需要爬取的数据。
axios发送一个http请求，得到服务器的响应结果。
cheerio JQuery的核心库 与dom无关

2、使用Cheerio库解析HTML页面，提取所需数据。
// 抓取网站中的数据

const axios = require("axios").default;
const cheerio = require("cheerio");

// 导入数据库模型Books
const Book = require("../models/Book");

/**
 *获取网页的源代码
 */
async function getBooksHTML() {
    const resp = await axios.get("https://book.douban.com/latest");
    return resp.data;
}

/**
 * 从网站中得到完整网页，并从网页中分析书籍的基本信息，得到一个书籍的详情页数组
 */
async function getBooklLinks() {
    const html = await getBooksHTML();
    // 用于将html字符串变为可可使用就JQuery方法操作的数据
    const $ = cheerio.load(html);
    // 获取到lis
    const achorElements = $("#content .grid-16-8 li .media__body h2 a");
    const links = achorElements
        .map((i, ele) => {
            const href = ele.attribs["href"]; // 得到所有链接地址

            return href;
        })
        .get(); // 得到一个真实的数组

    return links;
}

/**
 * 根据书籍详情页的地址，得到书籍的详细信息
 * @param {} url
 */
async function getBookDetail(url) {
    const resp = await axios.get(url);
    // 得到一个jQuery对象
    const $ = cheerio.load(resp.data);
    // 得到书籍的名称
    const name = $("h1").text().trim();
    // 得到书籍的封面地址
    const imgurl = $("#mainpic .nbg img").attr("src");
    // 得到书籍作者
    const spans = $("#info span.pl");
    const authorSpan = spans.filter((i, ele) => {
        return $(ele).text().includes("作者");
    });
    const author = authorSpan.next("a").text();

    // 得到书籍的出版日期
    const publishSpan = spans.filter((i, ele) => {
        return $(ele).text().includes("出版年");
    });

    const publishDate = publishSpan[0].nextSibling.nodeValue.trim();

    return {
        name,
        imgurl,
        publishDate,
        author,
    };
}

/**
 * 获取所有的书籍信息
 */
async function fetchAll() {
    const links = await getBooklLinks(); // 得到书籍的详情页地址
    const proms = links.map((link) => {
        return getBookDetail(link);
    });

    // 当书籍数据全部拿到之后，形成一个数组
    return Promise.all(proms);
}

/**
 * 得到数据信息，保存到数据库
 */
async function saveToDB() {
    const books = await fetchAll();
    await Book.bulkCreate(books);
    console.log("抓取到数据并保存到了数据库");
}

saveToDB();
3、使用Sequelize框架定义、同步数据模型并操作数据库，使用MySql持久化数据。
const { Sequelize } = require("sequelize");

// 创建一个 Sequelize 对象
module.exports = new Sequelize("myschooldb", "root", "123123", {
    host: "localhost",
    // 选择一种支持的数据库:
    // 'mysql', 'mariadb', 'postgres', 'mssql', 'sqlite', 'snowflake', 'db2' or 'ibmi'
    dialect: "mysql",
    // logging: null,//日志记录
});
// 设置模型关系

const Class = require("./Class");
const Student = require("./Student");

// 表示一个班级表里有多少学生
Class.hasMany(Student); // 建立表与表之间的关系
Student.belongsTo(Class); // 一个学生属于一个班级
const sequelize = require("./db");
const { DataTypes } = require("sequelize");

// 创建一个模型对象
const Admin = sequelize.define(
    "Admin",
    {
        // 在这里定义模型属性
        loginId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        loginPwd: {
            type: DataTypes.STRING,
            allowNull: false, // 默认为true
        },
    },
    {
        createdAt: false,
        updatedAt: false,
        paranoid: true, // 从此以后，该表的数据不会被真正的删除，而是增加一列deleteAt，记录删除的时间
    },
);
module.exports = Admin;
// 导入创建好的sequelize实例对象
const sequelize = require("./db");
// 导入 DataTypes 对象
const { DataTypes } = require("sequelize");

module.exports = sequelize.define(
    "Book",
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        imgurl: {
            type: DataTypes.STRING,
        },
        publishDate: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        author: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        paranoid: true,
    },
);
const sequelize = require("./db");

const { DataTypes } = require("sequelize");

const Class = sequelize.define(
    "Class",
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        openDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        createdAt: false, //createdAt 字段将包含代表创建时刻的时间戳
        updatedAt: false, //updatedAt 字段将包含最新更新的时间戳
        // 一个 paranoid 表是一个被告知删除记录时不会真正删除它的表.
        // 反而一个名为 deletedAt 的特殊列会将其值设置为该删除请求的时间戳.
        // 这意味着偏执表会执行记录的 软删除,而不是 硬删除.
        paranoid: true, // 偏执表
    },
);

module.exports = Class;
// 导入创建好的sequelize实例对象
const sequelize = require("./db");

//你在模型中定义的每一列都必须具有数据类型.
//Sequelize 提供很多内置数据类型.要访问内置数据类型,
//必须导入 DataTypes
const { DataTypes } = require("sequelize");

module.exports = sequelize.define(
    "Student",
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        birthday: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        sex: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING(11),
            allowNull: false,
        },
    },
    {
        createdAt: false, // 创建时间戳
        updatedAt: false, // 更新时间戳
        paranoid: true, // 不会在数据库中真正的删除（软删除）
    },
);
// 同步所有模型
require("./Admin"); // 导入admin模型
require("./Class"); // Class
require("./Book"); // Book
require("./Student"); // Student

const sequelize = require("./db");
// User.sync({ alter: true }) 这将检查数据库中表的当前状态
// (它具有哪些列, 它们的数据类型等),
// 然后在表中进行必要的更改以使其与模型匹配.
sequelize.sync({ alter: true }).then(() => {
    console.log("所有模型同步完成");
});

4、使用Express框架搭建轻量级服务器，为前端提供REST风格的接口。
http模块：
a. 根据不同的请求路径、请求方法、做不同的事情，处理起来比较麻烦
b. 读取请求体和写入响应体是通过流的方式，比较麻烦
使用第三方库：
a. express 基于 node.js平台 快速、开放、极简的 Web 开发框架
b. koa2
// 引入 express
const express = require("express");

// 创建 express 应用
// 是一个函数，用于处理请求
const app = express();

app.get("/api", (req, res) => {
    // req 和 res 是被 express 封装过后的对象
    console.log("请求头", req.headers); // 获取请求头对象
    console.log("请求路径", req.path); // 获取请求路径
    console.log("请求参数", req.query); // 获取请求参数

    // 可以动态设置响应头
    // res.setHeader("Access-Control-Allow-Origin", "*"); // 允许资源跨域

    // 302 临时重定向  301永久重定向
    // res.status(302).header("location", "https://www.google.com").end();
    // 简写
    // res.status(302).location("https://www.jd.com").end();
    res.redirect(302, "https://www.jd.com"); // 直接重定向 某地址
    // 响应
    // const obj = {
    //  city: "杭州",
    //  address: "西湖",
    // };
    // res.send(obj);
});

// 开启监听
app.listen(5000, () => {
    console.log("5000端口正在监听中。。。。");
});
       REST风格的API接口：对一个资源，通过不同的请求方法对它进行做不同的处理
比如添加一个学生。都以/api开头/student
/api/student            post      添加学生
/api/student/:id?     get        获取学生
/api/student/id        put       修改学生
/api/student/id        delete   删除一个学生
all表示匹配任何请求方法。
express中间件：当匹配到了请求后，交给第一个处理函数处理，函数中需要手动交给后续中间件处理。
中间件处理的细节：如果后续已经没有了中间件  express 发现如果响应没有结束，express 会响应 404  如果中间件发生了错误，不会停止服务器，相当用调用了 next(错误对象）,寻找后续的错误处理中间件，如果没有找到响应 500 -->（500表示服务器内部错误）



中间件文件：在服务器执行过程中，出现错误响应，中间件处理文件可以捕捉到错误。





常用中间件：express.static()   express.json()   express.urlencoded()
exrepss 路由：本身就是一个中间件


5、通过Postman工具测试接口请求和响应数据，确保接口的正常工作和数据的准确性。


技术架构：Node + Axios + Cheerio + Sequelize + MySql + Express + Postman

SQL注入：用户通过注入sql语句到最终查询中，导致了整个sql与预期请求不符。

Sequelize：ORM （Object Relational Mapping）对象关系映射 （是前端使用的ORM框架）
通过ORM框架，可以自动地把程序中的对象和数据库关联
ORM框架会隐藏具体的数据库底层细节，让开发者使用同样的数据操作接口，完成对不同数据库的操作
ORM的优势：1.开发者不需要关心数据库，仅需关心对象   2.可轻易的完成数据库的移植  3.无需拼接复杂的sql语句即可完成精确查询
Node中的ORM：Sequelize （支持JS,TS， 成熟)   TypeORM（支持TS，不成熟）

模型的增删改：
三层架构理解：
路由层（Route) - 提供对外的API访问接口
服务层(Service) - 提供业务逻辑的支持
数据访问层(DAO) - 提供与数据库或其他持久设备的通信，通常为ORM（模型与数据库相关的数据）

导出方式和导入方式

数据验证的位置
1. 客户端（浏览器、app、pad、小程序）验证：为了用户体验
2. 路由层：验证接口格式是否正确
3. 服务器端逻辑验证（业务逻辑的验证）：为了业务逻辑的完整性，安全性
4. 数据库验证：保证数据完整性
相关库：
validator  用于验证某个字符串是否满足某个规则
validate.js  用于验证某个对象的属性是否满足某些规则
