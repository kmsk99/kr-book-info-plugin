import axios from "axios";
import { load } from "cheerio";

// search keyword and return yes24 search result from 국내도서
const searchBookUrl = async (keyword: string) => {
	keyword = encodeURI(keyword);
	try {
		const html = await axios.get(
			`https://cors-anywhere-kmsk99.herokuapp.com/http://www.yes24.com/Product/Search?domain=BOOK&query=` +
				keyword
		);
		const $ = load(html.data);
		const bookUrl = $(
			"#yesSchList > li:nth-child(1) > div > div.item_info > div.info_row.info_name > a.gd_name"
		).attr("href");

		return bookUrl;
	} catch (err) {
		return "";
	}
};

// search keyword and return yes24 search result from 통합검색
const totalSearchBookUrl = async (keyword: string) => {
	keyword = encodeURI(keyword);
	try {
		const html = await axios.get(
			`https://cors-anywhere-kmsk99.herokuapp.com/http://www.yes24.com/Product/Search?domain=ALL&query=` +
				keyword
		);
		const $ = load(html.data);
		const bookUrl = $(
			"#yesSchList > li:nth-child(1) > div > div.item_info > div.info_row.info_name > a.gd_name"
		).attr("href");

		return bookUrl;
	} catch (err) {
		return "";
	}
};

// get book url
// if not searched in 국내도서, research at 통합검색 and return url
const getBookUrl = async (keyword: string) => {
	let bookUrl = await searchBookUrl(keyword);

	if (!bookUrl) bookUrl = await totalSearchBookUrl(keyword);

	return bookUrl;
};

// goto book info
// if book has sub title, title will be merged
// if page is not number, convert into 0
const getBookInfoResult = async (bookUrl: string) => {
	bookUrl = encodeURI(bookUrl);
	try {
		const html = await axios.get(
			`https://cors-anywhere-kmsk99.herokuapp.com/http://www.yes24.com` +
				bookUrl
		);
		const $ = load(html.data);
		const tags: string[] = [];

		$(
			"#infoset_goodsCate > div.infoSetCont_wrap > dl:nth-child(1) > dd > ul > li > a"
		).each((_, elem) => {
			tags.push($(elem).text().replace(/(\s*)/g, ""));
		});

		const tag = [...new Set(tags)];

		let title = $(
			"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > div > h2"
		)
			.text()
			.replace(/\(.*\)/gi, "")
			.replace(/\[.*\]/gi, "")
			.replace(":", "：")
			.replace("?", "？")
			.trim();

		const subTitle = $(
			"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > div > h3"
		)
			.text()
			.replace(":", "：")
			.replace("?", "？")
			.trim();

		if (subTitle) {
			title = title + "：" + subTitle;
		}

		const author: string[] = [];
		$(
			"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > span.gd_pubArea > span.gd_auth"
		)
			.children()
			.each((_, elem) => {
				if ($(elem).text()[0] !== "\n") {
					author.push($(elem).text());
				}
			});

		let page = +$(
			"#infoset_specific > div.infoSetCont_wrap > div > table > tbody > tr:nth-child(2) > td"
		)
			.text()
			.split(" ")[0]
			.slice(0, -1);

		if (isNaN(page)) page = 0;

		const publishDate = $(
			"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > span.gd_pubArea > span.gd_date"
		)
			.text()
			.split(" ")
			.map((v) => v.slice(0, -1))
			.join("-");

		const coverUrl = $(
			"#yDetailTopWrap > div.topColLft > div > span > em > img"
		).attr("src");

		const result = `---
created: ${
			new Date(+new Date() + 3240 * 10000).toISOString().split("T")[0] +
			" " +
			new Date().toTimeString().split(" ")[0].slice(0, 5)
		}
tag: 📚독서 ${tag.join(" ")}
title: ${title}
author: ${author.join(", ")}
category: ${tag[1]}
total_page: ${page}
publish_date: ${publishDate}
cover_url: ${coverUrl}
status: 🟩 완료
start_read_date: ${
			new Date(+new Date() + 3240 * 10000).toISOString().split("T")[0]
		}
finish_read_date: ${
			new Date(+new Date() + 3240 * 10000).toISOString().split("T")[0]
		}
my_rate: 
book_note: ❌
---

# ${title}`;

		return [
			title
				.replace("：", " ")
				.replace("？", "")
				.replace("/", "／")
				.replace(/\s{2,}/gi, " "),
			result,
		];
	} catch (err) {
		return ["", ""];
	}
};

// get book's info and return frontmatter
const getBook = async (keyword: string) => {
	const bookUrl = await getBookUrl(keyword);

	if (!bookUrl) {
		return [keyword, `${keyword} No title found`];
	}

	const [title, result] = await getBookInfoResult(bookUrl);

	if (!result) {
		return [keyword, `${keyword} No title found`];
	}

	return [title, result];
};

export { getBook };
