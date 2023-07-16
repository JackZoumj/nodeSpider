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
