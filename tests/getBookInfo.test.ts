import { readFileSync } from 'fs';
import { join } from 'path';
import { requestUrl } from 'obsidian';
import { getBookInfo, parseBookInfo } from '../src/getBookInfo';
const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', `detail-${name}.html`), 'utf8');

it('reads real JSON-LD metadata and introduction inside a table', () => {
	const book = parseBookInfo(fixture('demian'),'176787');
	expect(book).toMatchObject({ title:'데미안', pages:239, isbn:'9788937460449', publishDate:'2000-12-20', publisher:'민음사' });
	expect(book.authors).toContain('헤르만 헤세');
	expect(book.introduction).toContain('독일 문학');
	expect(book.introduction).not.toMatch(/<br|<b>|undefined/);
});
it.each([['vegetarian','108422348'],['ebook','145759629']])('parses real %s metadata', (name,id) => {
	const book=parseBookInfo(fixture(name),id);
	expect(book.title).toBeTruthy();expect(book.isbn).toMatch(/^\d{13}$/);expect(book.cover).toMatch(/^https:/);
});
it('uses headers instead of row positions when structured data is absent or malformed', () => {
	const html=`<script type="application/ld+json">invalid</script><div id="yDetailTopWrap"><div class="gd_infoTop"><h2>Fallback</h2></div><span class="gd_auth"><a>Author</a><a>Author</a></span><span class="gd_date">2020년 1월 2일</span><span class="gd_img"><img src="http://image.yes24.com/test"></span></div><div id="infoset_specific"><table><tr><th>ISBN13</th><td>1234567890123</td></tr><tr><th>쪽수, 무게</th><td>1,024쪽 | 2kg</td></tr></table></div><div id="infoset_goodsCate"><dl><li><a>국내도서</a></li></dl></div><div id="infoset_introduce"><div class="infoWrap_txt"><p>첫줄<br>둘째줄</p><script>bad()</script></div></div>`;
	const book=parseBookInfo(html,'1');
	expect(book).toMatchObject({pages:1024,publishDate:'2020-01-02',authors:['Author'],categories:['국내도서'],isbn:'1234567890123'});
	expect(book.introduction).toBe('첫줄\n둘째줄');expect(book.contents).toBe('');
});
it('handles graph/array JSON-LD and never chooses a related work with a different SKU', () => {
	const data=[{'@type':'WebPage'}, {'@graph':[{'@type':'Book',sku:'2',name:'Wrong'}, {'@type':'Book',sku:'1',name:'Right',author:['Author'],image:[{contentUrl:'https://image.yes24.com/a'}]}]}];
	expect(parseBookInfo(`<script type="application/ld+json">${JSON.stringify(data)}</script>`,'1')).toMatchObject({title:'Right',authors:['Author']});
});
it('fails clearly for a changed page and invalid IDs', async () => {
	expect(()=>parseBookInfo('<html>blocked</html>','1')).toThrow('상세정보');
	await expect(getBookInfo('../bad')).rejects.toThrow('번호');
	(requestUrl as jest.Mock).mockResolvedValue({status:200,text:fixture('demian')});
	expect((await getBookInfo('176787')).pages).toBe(239);
});

it('falls back when JSON-LD contains no Book',()=>{
    expect(parseBookInfo('<script type="application/ld+json">[null,{"@type":"WebPage"}]</script><div id="yDetailTopWrap"><div class="gd_infoTop"><h2>Fallback</h2></div></div>','1').title).toBe('Fallback');
});

it('uses HTML metadata when JSON-LD is incomplete', () => {
	const html = `<script type="application/ld+json">{"@type":"Book","author":[{},null],"publisher":null,"genre":null}</script>
	<div id="yDetailTopWrap"><div class="gd_infoTop"><h2>책 &amp; 부제</h2></div><span class="gd_pub">출판사</span><span class="gd_auth"><a></a><a>작가</a></span><span class="gd_img"><img></span></div>
	<div id="infoset_specific"><table><tr><th>ISBN13</th></tr><tr><td>unknown</td></tr></table></div>
	<div id="infoset_goodsCate"><dl><li><a></a><a>분류</a><a>분류</a></li></dl></div>
	<div id="infoset_introduce"></div><div id="infoset_toc"><div class="infoWrap_txt"></div></div>`;
	expect(parseBookInfo(html, '1')).toMatchObject({ title: '책 & 부제', authors: ['작가'], publisher: '출판사', categories: ['분류'], pages: 0, isbn: '', cover: '', introduction: '', contents: '' });
});

it('ignores nested related editions and reads subsequent valid structured data', () => {
	const html = `<script type="application/ld+json"></script>
	<script type="application/ld+json">{"@type":"WebPage","workExample":{"@type":"Book","name":"Wrong"}}</script>
	<script type="application/ld+json">{"@type":"Book","sku":1,"name":"Right","genre":"소설","image":"https://image.yes24.com/a","author":{"name":"작가"}}</script>`;
	expect(parseBookInfo(html, '1')).toMatchObject({ title: 'Right', categories: ['소설'], authors: ['작가'], cover: 'https://image.yes24.com/a' });
});

it.each(['javascript:alert(1)', 'data:image/svg+xml,x', '//evil.example/image'])('does not emit an unsafe cover URL: %s', cover => {
	const html = `<script type="application/ld+json">${JSON.stringify({ '@type': 'Book', name: 'Book', image: cover })}</script>`;
	expect(parseBookInfo(html, '1').cover).toBe('');
});

it('converts rich text once without executing markup or duplicating the hidden source', () => {
	const html = `<div id="yDetailTopWrap"><div class="gd_infoTop"><h2>Book</h2></div></div>
	<div id="infoset_introduce"><textarea class="txtContentText">&lt;b&gt;A &amp;amp; B&lt;/b&gt;&lt;BR/&gt;&lt;div&gt;Second&lt;/div&gt;&lt;script&gt;bad()&lt;/script&gt;</textarea><div class="infoWrap_txt">DUPLICATE</div></div>
	<div id="infoset_toc"><div class="infoWrap_txt"><ul><li>One</li><li>Two</li></ul><style>bad</style></div></div>`;
	const book = parseBookInfo(html, '1');
	expect(book.introduction).toBe('A & B\nSecond');
	expect(book.contents).toBe('One\nTwo');
});
