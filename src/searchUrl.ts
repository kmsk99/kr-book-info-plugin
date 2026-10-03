import { requestText } from './yes24Request';

export type BookDomain = 'BOOK' | 'FOREIGN' | 'EBOOK';
export const BOOK_DOMAINS: Record<BookDomain, string> = {
	BOOK: '국내도서', FOREIGN: '외국도서', EBOOK: '전자책',
};
export interface BookCandidate {
	id: string;
	url: string;
	title: string;
	author: string;
	publisher: string;
	date: string;
	kind: string;
	edition: string;
}
export interface BookSearchResult {
	books: BookCandidate[];
	total: number;
	page: number;
	hasMore: boolean;
}
const PAGE_SIZE = 24;
const text = (node: Element, selector: string) =>
	node.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() || '';

/** The real search UI returns HTML fragments in a JSON envelope, not book objects. */
export function parseSearchResponse(data: unknown, page: number, domain: BookDomain): BookSearchResult {
	if (!data || typeof (data as { listHtml?: unknown }).listHtml !== 'string') {
		throw new Error('YES24 검색 응답 형식이 변경되었습니다.');
	}
	const html = new DOMParser().parseFromString((data as { listHtml: string }).listHtml, 'text/html');
	const count = html.querySelector('.sGoodsSecTit')?.textContent?.match(/\(([\d,]+)\)/);
	if (!count) throw new Error('YES24 검색 결과 수를 읽을 수 없습니다.');
	const total = Number(count[1].replace(/,/g, ''));
	const books: BookCandidate[] = [];
	const seen = new Set<string>();
	html.querySelectorAll('#yesSchList > li').forEach(row => {
		const href = row.querySelector('a.gd_name')?.getAttribute('href') || '';
		const match = href.match(/^\/product\/goods\/(\d+)$/i);
		const title = text(row, 'a.gd_name');
		if (!match || !title || seen.has(match[1])) return;
		seen.add(match[1]);
		row.querySelectorAll('.moreAuthArea').forEach(node => node.remove());
		const edition = Array.from(row.querySelectorAll('.gd_feature .feature')).map(node => node.textContent?.trim()).filter(Boolean).join(' · ');
		books.push({
			id: match[1], url: `/Product/Goods/${match[1]}`, title,
			author: text(row, '.info_auth'), publisher: text(row, '.info_pub'),
			date: text(row, '.info_date'), kind: BOOK_DOMAINS[domain],
			edition: edition || text(row, '.gd_feature').replace(/^\[\s*|\s*\]$/g, '').trim(),
		});
	});
	if (total > (page - 1) * PAGE_SIZE && books.length === 0) {
		throw new Error('YES24 도서 목록을 읽을 수 없습니다.');
	}
	return { books, total, page, hasMore: page * PAGE_SIZE < total };
}

export async function searchBooks(query: string, page = 1, domain: BookDomain = 'BOOK'): Promise<BookSearchResult> {
	query = query.trim();
	if (!query) return { books: [], total: 0, page: 1, hasMore: false };
	if (!Number.isInteger(page) || page < 1 || !Object.prototype.hasOwnProperty.call(BOOK_DOMAINS, domain)) throw new Error('잘못된 검색 조건입니다.');
	const params = new URLSearchParams({
		query, domain, page: String(page), size: String(PAGE_SIZE), order: 'RELATION',
		isSchTotal: 'false', isQueryProcessed: 'false',
	});
	const response = await requestText(`https://www.yes24.com/product/search/SearchContentsJson?${params}`);
	let data: unknown;
	try { data = JSON.parse(response); }
	catch { throw new Error('YES24 검색 응답을 읽을 수 없습니다. 잠시 후 다시 검색해 주세요.'); }
	return parseSearchResponse(data, page, domain);
}
