import { requestUrl, stringifyYaml } from "obsidian";

interface getBookInfoOutput {
	ok: boolean;
	book?: bookData;
}

interface bookData {
	title: string;
	main: string;
}

interface getBookInfoInput {
	bookUrl: string;
	defaultTag: string;
	status: string;
	myRate: string;
	bookNote: string;
	toggleTitle: boolean;
	toggleIntroduction: boolean;
	toggleIndex: boolean;
}

const titlePipeline = (title: string) => {
	return title
		.replace(/\(.*\)/gi, "")
		.replace(/\[.*\]/gi, "")
		.replace(":", "：")
		.replace("?", "？")
		.trim();
};

// goto book info
// if book has sub title, title will be merged
// if page is not number, convert into 0
export const getBookInfoResult = async ({
	bookUrl,
	defaultTag,
	status,
	myRate,
	bookNote,
	toggleTitle,
	toggleIntroduction,
	toggleIndex,
}: getBookInfoInput): Promise<getBookInfoOutput> => {
	bookUrl = encodeURI(bookUrl);

	try {
		const response = await requestUrl({
			url: `http://www.yes24.com` + bookUrl,
		});

		const parser = new DOMParser();
		const html = parser.parseFromString(response.text, "text/html");

		const tags: string[] = [defaultTag && defaultTag];

		html.querySelectorAll(
			"#infoset_goodsCate > div.infoSetCont_wrap > dl:nth-child(1) > dd > ul > li > a"
		).forEach((value) => {
			tags.push(value.getText().replace(/(\s*)/g, ""));
		});

		const tag = [...new Set(tags)];

		const mainTitle = html
			.querySelector(
				"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > div > h2"
			)
			.getText();

		const subTitle = html
			.querySelector(
				"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > div > h3"
			)
			?.getText();

		const title = subTitle
			? `${titlePipeline(mainTitle)}：${titlePipeline(subTitle)}`
			: titlePipeline(mainTitle);

		const authors: string[] = [];

		html.querySelectorAll(
			"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > span.gd_pubArea > span.gd_auth > a"
		).forEach((value) => {
			authors.push(value.getText().trim());
		});

		html.querySelectorAll(
			"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > span.gd_pubArea > span.gd_auth > span > span.moreAuthLi > span > ul > li > a"
		).forEach((value) => {
			authors.push(value.getText().trim());
		});

		const author = [...new Set(authors)];

		const page =
			+html
				.querySelector(
					"#infoset_specific > div.infoSetCont_wrap > div > table > tbody > tr:nth-child(2) > td"
				)
				.getText()
				.split(" ")[0]
				.slice(0, -1) || 0;

		const publishDate = html
			.querySelector(
				"#yDetailTopWrap > div.topColRgt > div.gd_infoTop > span.gd_pubArea > span.gd_date"
			)
			.getText()
			.split(" ")
			.map((v) => v.slice(0, -1))
			.join("-");

		const coverUrl = html
			.querySelector(
				"#yDetailTopWrap > div.topColLft > div > span > em > img"
			)
			.getAttribute("src");

		const introduction = html
			.querySelector(
				"#infoset_introduce > div.infoSetCont_wrap > div.infoWrap_txt > div"
			)
			?.getText()
			.replace(/(<br>|<br\/>|<br \/>)/g, "\r\n")
			.replace(/(<b>|<B>|<\/b>|<\/B>|\[|\]|\*|\#)/g, "")
			.split("\n")
			.map((line) => line.trim() + "\n")
			.join("");

		const index = html
			.querySelector(
				"#infoset_toc > div.infoSetCont_wrap > div.infoWrap_txt"
			)
			?.getText()
			.replace(/(<br>|<br\/>|<br \/>)/g, "\r\n")
			.replace(/(<b>|<B>|<\/b>|<\/B>|\[|\]|\*|\#)/g, "")
			.split("\n")
			.map((line) => line.trim() + "\n")
			.join("");

		const frontmatter = {
			created: `${
				new Date(+new Date() + 3240 * 10000)
					.toISOString()
					.split("T")[0] +
				" " +
				new Date().toTimeString().split(" ")[0].slice(0, 5)
			}`,
			tag: `${tag.join(" ")}`,
			title: `${title}`,
			author: `${author.join(", ")}`,
			category: `${tag[1]}`,
			total_page: page,
			publish_date: `${publishDate}`,
			cover_url: `${coverUrl}`,
			status: `${status}`,
			start_read_date: `${
				new Date(+new Date() + 3240 * 10000).toISOString().split("T")[0]
			}`,
			finish_read_date: `${
				new Date(+new Date() + 3240 * 10000).toISOString().split("T")[0]
			}`,
			my_rate: +myRate,
			book_note: `${bookNote}`,
		};

		const main = `---\n${stringifyYaml(frontmatter)}---\n${
			toggleTitle ? `\n# ${title}` : ""
		}${toggleIntroduction ? `\n\n# 책소개\n${introduction}` : ""}${
			toggleIndex ? `\n\n# 목차\n${index}` : ""
		}`;

		return {
			ok: true,
			book: {
				title: title
					.replace("：", " ")
					.replace("？", "")
					.replace("/", "／")
					.replace(/\s{2,}/gi, " "),
				main,
			},
		};
	} catch (err) {
		console.log(err);
		return {
			ok: false,
		};
	}
};
