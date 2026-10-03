import KrBookInfo from '../main';
import {Notice} from 'obsidian';
import {BookSearchModal} from '../src/BookSearchModal';
import * as books from '../src/getBook';
import * as persistence from '../src/saveBook';
const settings={defaultTag:'책',statusSetting:'읽는 중',myRateSetting:'3',bookNoteSetting:'',toggleTitle:true,toggleIntroduction:true,toggleIndex:true};
let plugin:KrBookInfo;let app:any;let choose:jest.SpyInstance;let get:jest.SpyInstance;let save:jest.SpyInstance;
beforeEach(()=>{
	app={workspace:{getActiveFile:jest.fn(()=>({path:'A.md',basename:'A',extension:'md'}))}};
	plugin=new KrBookInfo(app,{} as any);plugin.settings=settings;
	choose=jest.spyOn(BookSearchModal.prototype,'choose').mockResolvedValue({id:'2',title:'B'} as any);
	get=jest.spyOn(books,'getBook').mockResolvedValue({title:'B',metadata:{},defaults:{},body:''});save=jest.spyOn(persistence,'saveBook').mockResolvedValue();jest.clearAllMocks();
});
afterEach(()=>jest.restoreAllMocks());
it('imports exactly the selected product into the original file even if the active tab changes',async()=>{
	const file=app.workspace.getActiveFile();app.workspace.getActiveFile.mockReturnValueOnce(file).mockReturnValue({path:'Other.md'});
	await plugin.addBookInfoToActiveFile();expect(get).toHaveBeenCalledWith('2',settings);expect(save).toHaveBeenCalledWith(app,file,expect.anything());expect(Notice).toHaveBeenCalledWith('도서 정보를 저장했습니다.');
});
it('does nothing after cancellation or without a Markdown file',async()=>{
	choose.mockResolvedValue(null);await plugin.addBookInfoToActiveFile();expect(get).not.toHaveBeenCalled();expect(save).not.toHaveBeenCalled();
	app.workspace.getActiveFile.mockReturnValue(null);await plugin.addBookInfoToActiveFile();
	app.workspace.getActiveFile.mockReturnValue({extension:'pdf'});await plugin.addBookInfoToActiveFile();expect(choose).toHaveBeenCalledTimes(1);
});
it('handles errors and permits retry without a stuck busy flag',async()=>{
	jest.spyOn(console,'error').mockImplementation(()=>{});get.mockRejectedValueOnce(new Error('offline'));
	await plugin.addBookInfoToActiveFile();expect(save).not.toHaveBeenCalled();expect(Notice).toHaveBeenCalledWith('offline');
	await plugin.addBookInfoToActiveFile();expect(save).toHaveBeenCalledTimes(1);
});
it('prevents repeated commands while choosing',async()=>{
	let resolve:any;choose.mockReturnValue(new Promise(r=>resolve=r));const first=plugin.addBookInfoToActiveFile();await plugin.addBookInfoToActiveFile();expect(choose).toHaveBeenCalledTimes(1);resolve(null);await first;
});
it('registers working command and ribbon callbacks and loads/saves settings',async()=>{
	let command:any,ribbon:any;plugin.addCommand=jest.fn((c): any =>{command=c;return null;});plugin.addRibbonIcon=jest.fn((_i,_n,cb): any =>{ribbon=cb;return null;});plugin.addSettingTab=jest.fn();plugin.loadData=jest.fn().mockResolvedValue({defaultTag:'custom'});plugin.saveData=jest.fn();
	await plugin.onload();expect(plugin.settings.defaultTag).toBe('custom');
	const run=jest.spyOn(plugin,'addBookInfoToActiveFile').mockResolvedValue();await command.callback();await ribbon({});expect(run).toHaveBeenCalledTimes(2);await plugin.saveSettings();expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
	plugin.onunload();
});

it('does not save a late detail response after the plugin is disabled', async () => {
	let resolve: (value: books.BookNote) => void;
	get.mockReturnValue(new Promise(r => { resolve = r; }));
	const pending = plugin.addBookInfoToActiveFile();
	await Promise.resolve();
	plugin.onunload();
	resolve({ title: 'Late', metadata: {}, defaults: {}, body: '' });
	await pending;
	expect(save).not.toHaveBeenCalled();
	expect(Notice).not.toHaveBeenCalledWith('도서 정보를 저장했습니다.');
});

it('closes a pending selection when unloaded and ignores commands after unload', async () => {
	choose.mockRestore();
	const pending = plugin.addBookInfoToActiveFile();
	plugin.onunload();
	await pending;
	await plugin.addBookInfoToActiveFile();
	expect(get).not.toHaveBeenCalled();
	expect(save).not.toHaveBeenCalled();
});

it('does not show success before persistence has resolved and hides loading on failure', async () => {
	jest.spyOn(console, 'error').mockImplementation(() => {});
	let reject: (reason: Error) => void;
	save.mockReturnValue(new Promise((_resolve, r) => { reject = r; }));
	const pending = plugin.addBookInfoToActiveFile();
	await Promise.resolve(); await Promise.resolve();
	expect(Notice).not.toHaveBeenCalledWith('도서 정보를 저장했습니다.');
	const loading = (Notice as unknown as jest.Mock).mock.results.find(result => result.value?.hide)?.value;
	expect(loading.hide).not.toHaveBeenCalled();
	reject(new Error('disk full')); await pending;
	expect(loading.hide).toHaveBeenCalledTimes(1);
	expect(Notice).not.toHaveBeenCalledWith('도서 정보를 저장했습니다.');
});

it('reports non-Error failures with a useful message', async () => {
	jest.spyOn(console, 'error').mockImplementation(() => {});
	get.mockRejectedValue('offline');
	await plugin.addBookInfoToActiveFile();
	expect(Notice).toHaveBeenCalledWith(expect.stringContaining('다시 시도'));
});

it('merges partial settings while retaining false and empty values', async () => {
	plugin.loadData = jest.fn().mockResolvedValue({ toggleTitle: false, defaultTag: '' });
	await plugin.loadSettings();
	expect(plugin.settings.toggleTitle).toBe(false);
	expect(plugin.settings.defaultTag).toBe('');
	expect(plugin.settings.myRateSetting).toBe('0');
});
