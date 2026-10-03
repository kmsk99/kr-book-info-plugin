import { requestText } from './yes24Request';

export interface BookInfo {
	title: string;
	authors: string[];
	publisher: string;
	isbn: string;
	pages: number;
	publishDate: string;
	cover: string;
	categories: string[];
	introduction: string;
	contents: string;
	url: string;
}
type JsonObject = Record<string, unknown>;
const object = (value: unknown): value is JsonObject => !!value && typeof value === 'object' && !Array.isArray(value);
const str = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const text = (html: Document, selector: string) => html.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() || '';

function structuredBook(html: Document, id: string): JsonObject {
	for (const script of Array.from(html.querySelectorAll('script[type="application/ld+json"]'))) {
		try {
			const parsed: unknown = JSON.parse(script.textContent || '');
			const roots: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
			const nodes = roots.flatMap(node => object(node) && Array.isArray(node['@graph']) ? [node, ...node['@graph']] : [node]);
			for (const node of nodes) {
				if (!object(node)) continue;
				const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
				if (types.includes('Book') && (!node.sku || String(node.sku) === id)) return node;
			}
		} catch { /* Some products have malformed JSON-LD; the semantic HTML is a fallback. */ }
	}
	return {};
}

/** Source HTML keeps rich text in a textarea; do not execute the site's scripts. */
function sectionText(html: Document, selector: string): string {
	const section = html.querySelector(selector);
	if (!section) return '';
	const source = section.querySelector('textarea.txtContentText');
	const raw = source ? (source as HTMLTextAreaElement).value : section.querySelector('.infoWrap_txt')?.innerHTML || '';
	const doc = new DOMParser().parseFromString(raw, 'text/html');
	doc.querySelectorAll('script, style, textarea').forEach(node => node.remove());
	doc.querySelectorAll('br').forEach(node => node.replaceWith('\n'));
	doc.querySelectorAll('p, div, li').forEach(node => node.append('\n'));
	return (doc.body.textContent || '').split('\n').map(line => line.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function parseBookInfo(source: string, id: string): BookInfo {
	const html = new DOMParser().parseFromString(source, 'text/html');
	const data = structuredBook(html, id);
	const title = str(data.name) || text(html, '#yDetailTopWrap .gd_infoTop h2');
	if (!title) throw new Error('YES24 도서 상세정보를 읽을 수 없습니다.');
	const rows = new Map<string, string>();
	html.querySelectorAll('#infoset_specific tr').forEach(row => {
		rows.set(row.querySelector('th')?.textContent?.trim() || '', row.querySelector('td')?.textContent?.trim() || '');
	});
	const authors = (Array.isArray(data.author) ? data.author : [data.author])
		.map(value => object(value) ? str(value.name) : str(value)).filter(Boolean);
	if (!authors.length) html.querySelectorAll('#yDetailTopWrap .gd_auth a').forEach(node => {
		const name = node.textContent?.trim(); if (name) authors.push(name);
	});
	const pageRow = Array.from(rows).find(([key]) => key.includes('쪽수'))?.[1] || '';
	const pageMatch = pageRow.match(/([\d,]+)\s*쪽/);
	const date = text(html, '#yDetailTopWrap .gd_date').match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
	const image = Array.isArray(data.image) ? data.image[0] : data.image;
	const cover = str(object(image) ? image.url || image.contentUrl : image) || html.querySelector('#yDetailTopWrap .gd_img img')?.getAttribute('src') || '';
	const categories = (Array.isArray(data.genre) ? data.genre : [data.genre]).map(str).filter(Boolean);
	if (!categories.length) html.querySelectorAll('#infoset_goodsCate dl:first-child li a').forEach(node => {
		const value = node.textContent?.trim(); if (value) categories.push(value);
	});
	return {
		title, authors: [...new Set(authors)],
		publisher: object(data.publisher) ? str(data.publisher.name) : text(html, '#yDetailTopWrap .gd_pub'),
		isbn: str(data.isbn) || rows.get('ISBN13') || '',
		pages: typeof data.numberOfPages === 'number' && Number.isFinite(data.numberOfPages) ? data.numberOfPages : pageMatch ? Number(pageMatch[1].replace(/,/g, '')) : 0,
		publishDate: str(data.datePublished) || (date ? `${date[1]}-${date[2].padStart(2, '0')}-${date[3].padStart(2, '0')}` : ''),
		cover: /^https?:\/\//i.test(cover) ? cover.replace(/^http:/i, 'https:') : '',
		categories: [...new Set(categories)], introduction: sectionText(html, '#infoset_introduce'),
		contents: sectionText(html, '#infoset_toc'), url: `https://www.yes24.com/Product/Goods/${id}`,
	};
}

export async function getBookInfo(id: string): Promise<BookInfo> {
	if (!/^\d+$/.test(id)) throw new Error('잘못된 YES24 도서 번호입니다.');
	return parseBookInfo(await requestText(`https://www.yes24.com/Product/Goods/${id}`), id);
}
