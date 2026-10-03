import { App, getFrontMatterInfo, normalizePath, TFile } from 'obsidian';
import { BookNote } from './getBook';

const START = '<!-- kr-book-info:start -->';
const END = '<!-- kr-book-info:end -->';

export function updateBookBody(content: string, body: string): string {
	const { contentStart } = getFrontMatterInfo(content);
	const frontmatter = content.slice(0, contentStart);
	const text = content.slice(contentStart);
	const block = body ? `${START}\n${body}\n${END}` : '';
	const start = text.indexOf(START);
	const end = text.indexOf(END, start + START.length);
	if (start >= 0 && end >= start) return frontmatter + text.slice(0, start) + block + text.slice(end + END.length);
	const separator = frontmatter && !frontmatter.endsWith('\n') && block ? '\n' : '';
	return frontmatter + separator + (block ? `${block}\n\n` : '') + text;
}

export async function saveBook(app: App, file: TFile, book: BookNote): Promise<void> {
	if (app.vault.getAbstractFileByPath(file.path) !== file) throw new Error('원래 노트가 삭제되거나 이동되었습니다. 다시 실행해 주세요.');
	const originalPath = file.path;
	const name = book.title.replace(/[\\/:*?"<>|\[\]#^\x00-\x1f]/g, '').replace(/\s+/g, ' ').replace(/[. ]+$/g, '').trim();
	if (!name) throw new Error('도서 제목으로 파일 이름을 만들 수 없습니다.');
	const target = normalizePath(`${file.parent?.path || ''}/${name}.md`);
	const existing = app.vault.getAbstractFileByPath(target);
	if (existing && existing !== file) throw new Error('같은 이름의 노트가 이미 있습니다. 기존 노트를 열어 실행해 주세요.');
	await app.fileManager.processFrontMatter(file, data => {
		Object.assign(data, book.metadata);
		for (const [key, value] of Object.entries(book.defaults)) if (data[key] === undefined) data[key] = value;
	});
	try {
		await app.vault.process(file, content => updateBookBody(content, book.body));
	} catch {
		throw new Error('도서 속성은 저장했지만 본문을 저장하지 못했습니다. 현재 노트를 확인해 주세요.');
	}
	if (file.path !== originalPath) throw new Error('저장 중 노트 위치가 변경되었습니다. 현재 노트를 확인해 주세요.');
	if (file.path !== target) {
		try { await app.fileManager.renameFile(file, target); }
		catch { throw new Error('도서 정보는 저장했지만 파일 이름을 바꾸지 못했습니다. 현재 노트를 확인해 주세요.'); }
	}
}
