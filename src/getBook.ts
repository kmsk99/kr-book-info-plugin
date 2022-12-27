import { getBookInfoResult } from "./getBookInfo";
import { getBookUrl } from "./searchUrl";

interface getBookInput {
	bookname: string;
	defaultTag: string;
	status: string;
	myRate: string;
	bookNote: string;
	toggleTitle: boolean;
	toggleIntroduction: boolean;
	toggleIndex: boolean;
}

interface getBookOutput {
	ok: boolean;
	book?: bookData;
	error?: string;
}

interface bookData {
	title: string;
	main: string;
}

// get book's info and return frontmatter
export const getBook = async ({
	bookname,
	defaultTag,
	status,
	myRate,
	bookNote,
	toggleTitle,
	toggleIntroduction,
	toggleIndex,
}: getBookInput): Promise<getBookOutput> => {
	const bookUrlResult = await getBookUrl(bookname);

	if (!bookUrlResult.ok) {
		return { ok: false, error: `${bookname} url not found` };
	}

	const bookInfoResult = await getBookInfoResult({
		bookUrl: bookUrlResult.url,
		defaultTag,
		status,
		myRate,
		bookNote,
		toggleTitle,
		toggleIntroduction,
		toggleIndex,
	});

	if (!bookInfoResult.ok) {
		return { ok: false, error: "Get book info error occured" };
	}

	return { ok: true, book: bookInfoResult.book };
};
