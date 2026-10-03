// Integration test: real parsers + recorded HTTP responses + native-host API doubles.
// A native Obsidian smoke test is recorded separately; this is not an app E2E test.
import {readFileSync} from 'fs';
import {join} from 'path';
import {requestUrl} from 'obsidian';
import {searchBooks} from '../src/searchUrl';
import {getBook} from '../src/getBook';
import {saveBook} from '../src/saveBook';
it('searches multiple results, fetches the selected single volume and preserves the note',async()=>{
	(requestUrl as jest.Mock).mockImplementation(async({url})=>({status:200,text:readFileSync(join(__dirname,'fixtures',url.includes('SearchContentsJson')?'search-vegetarian.json':'detail-vegetarian.html'),'utf8')}));
	const results=await searchBooks('채식주의자');const chosen=results.books.find(b=>b.id==='108422348')!;
	const book=await getBook(chosen.id,{defaultTag:'책',statusSetting:'완료',myRateSetting:'0',bookNoteSetting:'',toggleTitle:true,toggleIntroduction:true,toggleIndex:true});
	const file:any={path:'채식주의자.md',parent:{path:'/'}};let body='My notes';const metadata:any={my_rate:5,status:'읽는 중'};
	const app:any={vault:{getAbstractFileByPath:()=>file,process:async(_f:any,fn:any)=>{body=fn(body)}},fileManager:{processFrontMatter:async(_f:any,fn:any)=>fn(metadata),renameFile:jest.fn()}};
	await saveBook(app,file,book);
	expect(metadata).toMatchObject({title:'채식주의자',isbn:'9788936434595',total_page:276,my_rate:5,status:'읽는 중'});
	expect(body).toContain('My notes');expect(body).not.toContain('undefined');
	expect(requestUrl).toHaveBeenLastCalledWith(expect.objectContaining({url:'https://www.yes24.com/Product/Goods/108422348'}));
});
