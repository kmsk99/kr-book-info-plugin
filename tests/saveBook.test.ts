import {saveBook,updateBookBody} from '../src/saveBook';
import {BookNote} from '../src/getBook';
const note:BookNote={title:'New Book',metadata:{title:'New Book',isbn:'123'},defaults:{status:'완료',my_rate:0},body:'# New Book'};
function host(path='Books/Old.md') {
	const file={path,parent:{path:'Books'}};const data:any={status:'읽는 중',my_rate:5,custom:'keep'};
	const app:any={vault:{getAbstractFileByPath:jest.fn((p:string)=>p===file.path?file:null),process:jest.fn(async(_f,fn)=>fn('Original text'))},fileManager:{processFrontMatter:jest.fn(async(_f,fn)=>fn(data)),renameFile:jest.fn(async(_f,p)=>{file.path=p})}};
	return {app,file,data};
}
it('preserves frontmatter and body while replacing only the managed block on repeat runs',()=>{
	const original='---\ncustom: keep\n---\nMy notes';
	const one=updateBookBody(original,'# Book');const two=updateBookBody(one,'# Updated');
	expect(two).toContain('---\ncustom: keep\n---\n');expect(two).toContain('My notes');expect(two.match(/kr-book-info:start/g)).toHaveLength(1);expect(two).not.toContain('# Book');
	expect(updateBookBody(two,'')).not.toContain('kr-book-info:start');expect(updateBookBody('notes','')).toBe('notes');
});
it('preserves personal properties and awaits writes before rename',async()=>{
	const {app,file,data}=host();await saveBook(app,file as any,note);
	expect(data).toMatchObject({title:'New Book',isbn:'123',status:'읽는 중',my_rate:5,custom:'keep'});
	expect(file.path).toBe('Books/New Book.md');expect(app.vault.process.mock.invocationCallOrder[0]).toBeLessThan(app.fileManager.renameFile.mock.invocationCallOrder[0]);
});
it('refuses a collision or a deleted source before any write',async()=>{
	const {app,file}=host();app.vault.getAbstractFileByPath.mockImplementation((p:string)=>p===file.path?file:{});
	await expect(saveBook(app,file as any,note)).rejects.toThrow('이미');expect(app.fileManager.processFrontMatter).not.toHaveBeenCalled();
	app.vault.getAbstractFileByPath.mockReturnValue(null);await expect(saveBook(app,file as any,note)).rejects.toThrow('삭제');
});
it('normalizes root paths and avoids renaming an unchanged file',async()=>{
	const {app,file,data}=host('Old.md');file.parent.path='/';delete data.status;
	await saveBook(app,file as any,{...note,title:'New / Book: ?'});expect(file.path).toBe('New Book.md');expect(data.status).toBe('완료');
	app.fileManager.renameFile.mockClear();await saveBook(app,file as any,note);expect(app.fileManager.renameFile).not.toHaveBeenCalled();
});
it('reports persistence and rename errors instead of success',async()=>{
	const {app,file}=host();app.fileManager.processFrontMatter.mockRejectedValueOnce(new Error('invalid YAML'));
	await expect(saveBook(app,file as any,note)).rejects.toThrow('invalid YAML');expect(app.vault.process).not.toHaveBeenCalled();
	app.fileManager.renameFile.mockRejectedValueOnce(new Error('collision'));await expect(saveBook(app,file as any,note)).rejects.toThrow('정보는 저장');
	await expect(saveBook(app,file as any,{...note,title:'/?'})).rejects.toThrow('파일 이름');
});

it('keeps the closing YAML delimiter on its own line at EOF', () => {
	expect(updateBookBody('---\ncustom: keep\n---', '# Book'))
		.toBe('---\ncustom: keep\n---\n<!-- kr-book-info:start -->\n# Book\n<!-- kr-book-info:end -->\n\n');
});

it('does not move a note back after the user moves it during a write', async () => {
	const { app, file } = host();
	app.vault.process.mockImplementation(async () => { file.path = 'Elsewhere/Old.md'; });
	await expect(saveBook(app, file as any, note)).rejects.toThrow('위치');
	expect(app.fileManager.renameFile).not.toHaveBeenCalled();
});

it('explains partial success when body persistence fails and never renames', async () => {
	const { app, file } = host();
	app.vault.process.mockRejectedValueOnce(new Error('disk full'));
	await expect(saveBook(app, file as any, note)).rejects.toThrow('속성은 저장');
	expect(app.fileManager.renameFile).not.toHaveBeenCalled();
});

it('preserves explicit null, false, zero and array personal values', async () => {
	const { app, file, data } = host();
	Object.assign(data, { status: null, my_rate: 0, tag: ['custom'], book_note: false });
	await saveBook(app, file as any, { ...note, defaults: { status: 'done', my_rate: 5, tag: 'new', book_note: 'yes' } });
	expect(data).toMatchObject({ status: null, my_rate: 0, tag: ['custom'], book_note: false });
});

it('handles CRLF frontmatter and preserves text on both sides of the generated section', () => {
	const original = '---\r\ncustom: yes\r\n---\r\nBefore\n<!-- kr-book-info:start -->\nOld\n<!-- kr-book-info:end -->\nAfter';
	const next = updateBookBody(original, 'New');
	expect(next.startsWith('---\r\ncustom: yes\r\n---\r\nBefore\n')).toBe(true);
	expect(next.endsWith('\nAfter')).toBe(true);
	expect(next).not.toContain('Old');
	expect(updateBookBody('---\ncustom: yes\n---', '')).toBe('---\ncustom: yes\n---');
});

it('uses the current contents passed to Vault.process after a concurrent edit', async () => {
	const { app, file } = host();
	let saved = '';
	app.vault.process.mockImplementation(async (_file: any, modify: (text: string) => string) => {
		saved = modify('Text edited while search was open');
	});
	await saveBook(app, file as any, note);
	expect(saved).toContain('Text edited while search was open');
});

it('supports root notes without a parent object', async () => {
	const { app, file } = host('Old.md');
	file.parent = null;
	await saveBook(app, file as any, note);
	expect(file.path).toBe('New Book.md');
});
