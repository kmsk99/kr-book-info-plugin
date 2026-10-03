import { readFileSync } from 'fs';
import { join } from 'path';
import { requestUrl } from 'obsidian';
import { parseSearchResponse, searchBooks } from '../src/searchUrl';
const fixture = (name: string) => JSON.parse(readFileSync(join(__dirname, 'fixtures', `search-${name}.json`), 'utf8'));
const request = requestUrl as jest.Mock;
beforeEach(() => request.mockReset());

it('returns both set and single volume for the user to choose (issue 18)', () => {
	const result = parseSearchResponse(fixture('vegetarian'), 1, 'BOOK');
	expect(result.books).toEqual(expect.arrayContaining([
		expect.objectContaining({ id: '134872831', title: '채식주의자 + 소년이 온다 세트', edition: '2권' }),
		expect.objectContaining({ id: '108422348', title: '채식주의자', publisher: '창비' }),
	]));
	expect(result.books).toHaveLength(24);
	expect(result.total).toBe(34); expect(result.hasMore).toBe(true);
});
it('supports the next page, ISBN and no results', () => {
	expect(parseSearchResponse(fixture('vegetarian-p2'), 2, 'BOOK').hasMore).toBe(false);
	expect(parseSearchResponse(fixture('isbn'), 1, 'BOOK').books[0].id).toBe('176787');
	expect(parseSearchResponse(fixture('empty'), 1, 'BOOK').books).toEqual([]);
});
it.each(['EBOOK', 'FOREIGN'] as const)('labels %s candidates', domain => {
	const result = parseSearchResponse(fixture(domain.toLowerCase()), 1, domain);
	expect(result.books.length).toBeGreaterThan(0);
	expect(result.books[0].kind).toBe(domain === 'EBOOK' ? '전자책' : '외국도서');
});
it('encodes reserved characters in query parameters', async () => {
	request.mockResolvedValue({ status: 200, text: JSON.stringify(fixture('special')) });
	await searchBooks(' C++ & C# ', 2, 'BOOK');
	const url = new URL(request.mock.calls[0][0].url);
	expect(url.protocol).toBe('https:');expect(url.searchParams.get('query')).toBe('C++ & C#');
	expect(url.searchParams.get('page')).toBe('2'); expect(url.searchParams.get('order')).toBe('RELATION');
});
it('does not request blank queries and rejects invalid page/domain', async () => {
	expect((await searchBooks(' ')).books).toEqual([]);expect(request).not.toHaveBeenCalled();
	await expect(searchBooks('x', 0)).rejects.toThrow();
	await expect(searchBooks('x', 1, 'GIFT' as any)).rejects.toThrow();
});
it('distinguishes broken responses from no matches', async () => {
	for (const data of [null, {}, { listHtml: '<html>blocked</html>' }, { listHtml: '<div class="sGoodsSecTit">상품 (3)</div>' }]) expect(() => parseSearchResponse(data, 1, 'BOOK')).toThrow();
	request.mockResolvedValue({ status: 200, text: '<html>error</html>' });
	await expect(searchBooks('x')).rejects.toThrow('응답');
});
it('ignores untrusted URLs, missing titles and duplicate products', () => {
	const data = { listHtml: '<div class="sGoodsSecTit">상품 (4)</div><ul id="yesSchList">'+
	['/product/goods/1','/product/goods/1','https://evil.example/book','javascript:alert(1)'].map(url=>`<li><a class="gd_name" href="${url}">제목</a></li>`).join('')+'</ul>' };
	expect(parseSearchResponse(data,1,'BOOK').books.map(b=>b.id)).toEqual(['1']);
});

it('detects a broken result list on later pages too', () => {
	expect(() => parseSearchResponse({ listHtml: '<div class="sGoodsSecTit">상품 (34)</div>' }, 2, 'BOOK')).toThrow('목록');
});

it.each(['한강 & 창비', '100% 독서', 'C# 입문', 'title?query=other#fragment'])('preserves the query %s exactly', async query => {
	request.mockResolvedValue({ status: 200, text: JSON.stringify(fixture('empty')) });
	await searchBooks(query);
	const params = new URL(request.mock.calls[0][0].url).searchParams;
	expect(params.get('query')).toBe(query);
	expect(params.getAll('query')).toHaveLength(1);
});

it.each([NaN, Infinity, -1, 1.5])('rejects invalid page %s without making a request', async page => {
	await expect(searchBooks('query', page)).rejects.toThrow('조건');
	expect(request).not.toHaveBeenCalled();
});

it('rejects inherited property names as domains', async () => {
	await expect(searchBooks('query', 1, 'toString' as any)).rejects.toThrow('조건');
	expect(request).not.toHaveBeenCalled();
});

it('accepts an empty page beyond the last page', () => {
	expect(parseSearchResponse(fixture('empty'), 3, 'BOOK')).toMatchObject({ books: [], hasMore: false, page: 3 });
});

it('cleans duplicate author popovers and separates edition labels', () => {
	const books = parseSearchResponse(fixture('vegetarian'), 1, 'BOOK').books;
	expect(books.find(book => book.title === '무민은 채식주의자')!.author).not.toContain('정보 더 보기');
	expect(books.find(book => book.id === '108422348')!.edition).toContain('양장 · 개정판');
});

it('handles grouped counts, missing optional fields and nameless entries', () => {
	const data = { listHtml: '<div class="sGoodsSecTit">상품 (1,234)</div><ul id="yesSchList"><li></li><li><a class="gd_name" href="/product/goods/1"> </a></li><li><a class="gd_name" href="/Product/Goods/2">A &amp; B</a></li></ul>' };
	const result = parseSearchResponse(data, 1, 'BOOK');
	expect(result.total).toBe(1234);
	expect(result.books).toEqual([{ id: '2', url: '/Product/Goods/2', title: 'A & B', author: '', publisher: '', date: '', kind: '국내도서', edition: '' }]);
});
