import {BookSearchModal} from '../src/BookSearchModal';
import * as search from '../src/searchUrl';
const candidate: search.BookCandidate={id:'2',url:'/Product/Goods/2',title:'선택할 책',author:'저자',publisher:'출판사',date:'2026',kind:'국내도서',edition:'개정판'};
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
let spy:jest.SpyInstance;
beforeEach(()=>{spy=jest.spyOn(search,'searchBooks').mockResolvedValue({books:[candidate],total:25,page:1,hasMore:true});});
afterEach(()=>spy.mockRestore());
it('shows identifying details and resolves the explicit selection',async()=>{
	const modal=new BookSearchModal({} as any,'초기 제목');const choice=modal.choose();await flush();
	expect(spy).toHaveBeenCalledWith('초기 제목',1,'BOOK');expect(modal.contentEl.textContent).toContain('저자 · 출판사 · 2026');
	const button=modal.contentEl.querySelector<HTMLButtonElement>('.kr-book-result')!;button.click();button.click();expect(await choice).toEqual(candidate);
});
it('cancels without selecting, even with a late network response',async()=>{
	let resolve:any;spy.mockReturnValue(new Promise(r=>resolve=r));
	const modal=new BookSearchModal({} as any,'x');const choice=modal.choose();modal.close();
	resolve({books:[candidate],total:1,page:1,hasMore:false});await flush();expect(await choice).toBeNull();expect(modal.contentEl.textContent).toBe('');
});
it('paginates and searches by domain and a new query',async()=>{
	const modal=new BookSearchModal({} as any,'x');modal.choose();await flush();
	const buttons=()=>Array.from(modal.contentEl.querySelectorAll('button'));
	buttons().find(b=>b.textContent==='다음')!.click();await flush();expect(spy).toHaveBeenLastCalledWith('x',2,'BOOK');
	buttons().find(b=>b.textContent==='이전')!.click();await flush();expect(spy).toHaveBeenLastCalledWith('x',1,'BOOK');
	const input=modal.contentEl.querySelector('input')!;input.value='ISBN';input.dispatchEvent(new Event('input'));expect(modal.contentEl.querySelector('.kr-book-result')).toBeNull();
	modal.contentEl.querySelector('form')!.dispatchEvent(new Event('submit',{cancelable:true}));await flush();expect(spy).toHaveBeenLastCalledWith('ISBN',1,'BOOK');
	const domain=modal.contentEl.querySelector('select')!;domain.value='EBOOK';domain.dispatchEvent(new Event('change'));await flush();expect(spy).toHaveBeenLastCalledWith('ISBN',1,'EBOOK');
	buttons().find(b=>b.textContent==='취소')!.click();
});
it('shows empty, blank and failed searches without stale choices',async()=>{
	spy.mockResolvedValue({books:[],total:0,page:1,hasMore:false});
	const modal=new BookSearchModal({} as any,'x');modal.choose();await flush();expect(modal.contentEl.textContent).toContain('검색 결과가 없습니다');
	spy.mockRejectedValue(new Error('연결 실패'));modal.contentEl.querySelector('form')!.dispatchEvent(new Event('submit'));await flush();expect(modal.contentEl.textContent).toContain('연결 실패');
	modal.contentEl.querySelector('input')!.value=' ';modal.contentEl.querySelector('form')!.dispatchEvent(new Event('submit'));await flush();expect(modal.contentEl.textContent).toContain('입력하세요');modal.close();
});
it('discards an old response after a newer search',async()=>{
	let resolve:any;spy.mockReturnValueOnce(new Promise(r=>resolve=r));
	const modal=new BookSearchModal({} as any,'old');modal.choose();
	modal.contentEl.querySelector('input')!.value='new';modal.contentEl.querySelector('form')!.dispatchEvent(new Event('submit'));await flush();
	resolve({books:[{...candidate,title:'STALE'}],total:1,page:1,hasMore:false});await flush();expect(modal.contentEl.textContent).not.toContain('STALE');modal.close();
});

it('ignores a late failure after cancellation',async()=>{
    let reject:any;spy.mockReturnValue(new Promise((_r,j)=>reject=j));
    const modal=new BookSearchModal({} as any,'x');const choice=modal.choose();modal.close();reject(new Error('late'));await flush();expect(await choice).toBeNull();expect(modal.contentEl.textContent).toBe('');
});

it('requires explicit selection even when only one book is returned', async () => {
	spy.mockResolvedValue({ books: [candidate], total: 1, page: 1, hasMore: false });
	const modal = new BookSearchModal({} as any, 'one');
	const selected = jest.fn();
	const choice = modal.choose().then(selected);
	await flush();
	expect(selected).not.toHaveBeenCalled();
	expect(modal.contentEl.querySelectorAll('.kr-book-result')).toHaveLength(1);
	modal.close();
	await choice;
	expect(selected).toHaveBeenCalledWith(null);
});

it('renders remote titles as text rather than executable HTML', async () => {
	spy.mockResolvedValue({ books: [{ ...candidate, title: '<img src=x onerror=alert(1)>' }], total: 1, page: 1, hasMore: false });
	const modal = new BookSearchModal({} as any, 'x');
	modal.choose();
	await flush();
	expect(modal.contentEl.querySelector('img')).toBeNull();
	expect(modal.contentEl.querySelector('.kr-book-result-title')!.textContent).toContain('<img');
	modal.close();
});

it('discards a response if the user edits the query before submitting again', async () => {
	let resolve: (value: search.BookSearchResult) => void;
	spy.mockReturnValue(new Promise(r => { resolve = r; }));
	const modal = new BookSearchModal({} as any, 'old');
	modal.choose();
	const input = modal.contentEl.querySelector('input')!;
	input.value = 'new'; input.dispatchEvent(new Event('input'));
	resolve({ books: [candidate], total: 1, page: 1, hasMore: false });
	await flush();
	expect(modal.contentEl.querySelectorAll('.kr-book-result')).toHaveLength(0);
	expect(modal.contentEl.textContent).toContain('검색 버튼');
	modal.close();
});

it('recovers from non-Error rejections and allows a new search', async () => {
	spy.mockRejectedValueOnce('network unavailable');
	const modal = new BookSearchModal({} as any, 'x');
	modal.choose(); await flush();
	expect(modal.contentEl.textContent).toContain('검색에 실패');
	modal.contentEl.querySelector('form')!.dispatchEvent(new Event('submit'));
	await flush();
	expect(modal.contentEl.querySelectorAll('.kr-book-result')).toHaveLength(1);
	modal.close();
});
