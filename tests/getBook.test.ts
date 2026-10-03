import { getBook, BookSettings } from '../src/getBook';
import * as info from '../src/getBookInfo';
export const settings: BookSettings = {defaultTag:'책',statusSetting:'읽는 중',myRateSetting:'3',bookNoteSetting:'',toggleTitle:true,toggleIntroduction:true,toggleIndex:true};
it('uses the selected ID and prepares metadata separately from personal defaults',async()=>{
	const spy=jest.spyOn(info,'getBookInfo').mockResolvedValue({title:'Chosen',authors:['Writer'],publisher:'Pub',isbn:'123',pages:100,publishDate:'2020-01-01',cover:'',categories:['소설'],introduction:'Intro',contents:'TOC',url:'https://www.yes24.com/Product/Goods/2'});
	const book=await getBook('2',settings);
	expect(spy).toHaveBeenCalledWith('2');expect(book.metadata).toMatchObject({title:'Chosen',isbn:'123'});
	expect(book.defaults.status).toBe('읽는 중');expect(book.body).toBe('# Chosen\n\n## 책소개\nIntro\n\n## 목차\nTOC');
	spy.mockResolvedValue({title:'Empty',authors:[],publisher:'',isbn:'',pages:0,publishDate:'',cover:'',categories:[],introduction:'',contents:'',url:''});
	const empty=await getBook('3',{...settings,defaultTag:'',myRateSetting:'invalid',toggleTitle:false});
	expect(empty.body).toBe('');expect(empty.defaults.my_rate).toBe(0);
	spy.mockRestore();
});

it.each([
	[false, false, false], [false, false, true], [false, true, false], [false, true, true],
	[true, false, false], [true, false, true], [true, true, false], [true, true, true],
])('respects title=%s introduction=%s contents=%s independently', async (toggleTitle, toggleIntroduction, toggleIndex) => {
	const spy = jest.spyOn(info, 'getBookInfo').mockResolvedValue({ title: 'Book', authors: [], publisher: '', isbn: '', pages: 1, publishDate: '', cover: '', categories: [], introduction: 'INTRO', contents: 'CONTENTS', url: '' });
	try {
		const note = await getBook('1', { ...settings, toggleTitle, toggleIntroduction, toggleIndex });
		expect(note.body.includes('# Book')).toBe(toggleTitle);
		expect(note.body.includes('INTRO')).toBe(toggleIntroduction);
		expect(note.body.includes('CONTENTS')).toBe(toggleIndex);
		expect(note.body).not.toContain('undefined');
	} finally { spy.mockRestore(); }
});

it('uses a stable local calendar date for newly created reading properties', async () => {
	jest.useFakeTimers().setSystemTime(new Date(2026, 0, 2, 3, 4));
	const spy = jest.spyOn(info, 'getBookInfo').mockResolvedValue({ title: 'Book', authors: [], publisher: '', isbn: '', pages: 1, publishDate: '', cover: '', categories: [], introduction: '', contents: '', url: '' });
	try {
		expect((await getBook('1', settings)).defaults).toMatchObject({ created: '2026-01-02 03:04', start_read_date: '2026-01-02', finish_read_date: '2026-01-02' });
	} finally { spy.mockRestore(); jest.useRealTimers(); }
});
