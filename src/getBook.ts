import { getBookInfo } from './getBookInfo';

export interface BookSettings {
	statusSetting: string;
	myRateSetting: string;
	bookNoteSetting: string;
	defaultTag: string;
	toggleTitle: boolean;
	toggleIntroduction: boolean;
	toggleIndex: boolean;
}
export interface BookNote {
	title: string;
	metadata: Record<string, unknown>;
	defaults: Record<string, unknown>;
	body: string;
}

/** Fetch only the product the user chose. Never run another title search here. */
export async function getBook(id: string, settings: BookSettings): Promise<BookNote> {
	const book = await getBookInfo(id);
	const now = new Date();
	const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
	const parts: string[] = [];
	if (settings.toggleTitle) parts.push(`# ${book.title}`);
	if (settings.toggleIntroduction && book.introduction) parts.push(`## 책소개\n${book.introduction}`);
	if (settings.toggleIndex && book.contents) parts.push(`## 목차\n${book.contents}`);
	return {
		title: book.title,
		metadata: {
			title: book.title, author: book.authors.join(', '), publisher: book.publisher,
			isbn: book.isbn, total_page: book.pages, publish_date: book.publishDate,
			cover_url: book.cover, category: book.categories[0] || '', yes24_url: book.url,
		},
		defaults: {
			created: `${date} ${now.toTimeString().slice(0, 5)}`,
			tag: [settings.defaultTag, ...book.categories.map(value => value.replace(/\s/g, ''))].filter(Boolean).join(' '),
			status: settings.statusSetting, my_rate: Number(settings.myRateSetting) || 0,
			book_note: settings.bookNoteSetting, start_read_date: date, finish_read_date: date,
		},
		body: parts.join('\n\n'),
	};
}
