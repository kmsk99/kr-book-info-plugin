import { requestUrl } from "obsidian";

interface searchUrlOutput {
	ok: boolean;
	url?: string;
}

// search bookName and return yes24 search result from 국내도서
const searchBookUrl = async (bookName: string): Promise<searchUrlOutput> => {
	bookName = encodeURI(bookName);
	try {
		const response = await requestUrl({
			url:
				"http://www.yes24.com/Product/Search?domain=BOOK&query=" +
				bookName,
		});

		const parser = new DOMParser();
		const html = parser.parseFromString(response.text, "text/html");

		const bookUrl = html
			.querySelector(
				"#yesSchList > li:nth-child(1) > div > div.item_info > div.info_row.info_name > a.gd_name"
			)
			.getAttribute("href");

		return { ok: true, url: bookUrl };
	} catch (err) {
		console.log(err);
		return { ok: false };
	}
};

// search bookName and return yes24 search result from 통합검색
const totalSearchBookUrl = async (
	bookName: string
): Promise<searchUrlOutput> => {
	bookName = encodeURI(bookName);
	try {
		const response = await requestUrl({
			url:
				"http://www.yes24.com/Product/Search?domain=ALL&query=" +
				bookName,
		});

		const parser = new DOMParser();
		const html = parser.parseFromString(response.text, "text/html");

		const bookUrl = html
			.querySelector(
				"#yesSchList > li:nth-child(1) > div > div.item_info > div.info_row.info_name > a.gd_name"
			)
			.getAttribute("href");

		return { ok: true, url: bookUrl };
	} catch (err) {
		console.log(err);
		return { ok: false };
	}
};

// get book url
// if not searched in 국내도서, research at 통합검색 and return url
export const getBookUrl = async (
	bookName: string
): Promise<searchUrlOutput> => {
	const searchBookResult = await searchBookUrl(bookName);
	if (searchBookResult.ok) {
		return searchBookResult;
	}

	const searchTotalBookResult = await totalSearchBookUrl(bookName);
	if (searchTotalBookResult.ok) {
		return searchTotalBookResult;
	}

	return { ok: false };
};
