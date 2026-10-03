import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as obsidian from 'obsidian';

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
let PluginClass: any;
beforeAll(() => {
	// Exercise the same bundled file as the release, not just TypeScript imports.
	execFileSync(process.execPath, ['esbuild.config.mjs', 'production'], { cwd: join(__dirname, '..'), stdio: 'pipe' });
	const module = { exports: {} as any };
	const load = new Function('require', 'module', 'exports', readFileSync(join(__dirname, '..', 'main.js'), 'utf8'));
	load((name: string) => {
		if (name !== 'obsidian') throw new Error(`Unexpected runtime dependency: ${name}`);
		return obsidian;
	}, module, module.exports);
	PluginClass = module.exports.default;
});

async function waitFor(check: () => boolean) {
	for (let i = 0; i < 30; i++) {
		if (check()) return;
		await new Promise(resolve => setTimeout(resolve, 0));
	}
	throw new Error('Bundle did not reach expected state');
}

it('imports the selected single volume through the production bundle', async () => {
	(obsidian.requestUrl as jest.Mock).mockImplementation(async ({ url }) => ({
		status: 200,
		text: fixture(url.includes('SearchContentsJson') ? 'search-vegetarian.json' : 'detail-vegetarian.html'),
	}));
	const file = { path: '채식주의자.md', basename: '채식주의자', extension: 'md', parent: { path: '/' } };
	const metadata: any = { status: '읽는 중', my_rate: 5 };
	let body = 'Original notes';
	const app = {
		workspace: { getActiveFile: () => file },
		vault: { getAbstractFileByPath: () => file, process: async (_file: any, modify: (text: string) => string) => { body = modify(body); } },
		fileManager: { processFrontMatter: async (_file: any, update: (data: any) => void) => update(metadata), renameFile: jest.fn() },
	};
	const plugin = new PluginClass(app, {});
	await plugin.loadSettings();
	const pending = plugin.addBookInfoToActiveFile();
	const modal = plugin.searchModal;
	await waitFor(() => modal.contentEl.querySelectorAll('.kr-book-result').length > 0);
	const button = Array.from(modal.contentEl.querySelectorAll('.kr-book-result') as NodeListOf<HTMLButtonElement>)
		.find(row => row.querySelector('.kr-book-result-title')!.textContent === '채식주의자' && row.textContent!.includes('2022년'))!;
	button.click();
	await pending;
	expect(metadata).toMatchObject({ title: '채식주의자', isbn: '9788936434595', total_page: 276, status: '읽는 중', my_rate: 5 });
	expect(body).toContain('Original notes');
	expect(obsidian.requestUrl).toHaveBeenLastCalledWith(expect.objectContaining({ url: 'https://www.yes24.com/Product/Goods/108422348' }));
});

it('handles an empty search in the production bundle without the 1.4.0 title exception', async () => {
	(obsidian.requestUrl as jest.Mock).mockResolvedValue({ status: 200, text: fixture('search-empty.json') });
	const write = jest.fn();
	const plugin = new PluginClass({ workspace: { getActiveFile: () => ({ extension: 'md', basename: 'missing' }) }, vault: { process: write } }, {});
	await plugin.loadSettings();
	const pending = plugin.addBookInfoToActiveFile();
	const modal = plugin.searchModal;
	await waitFor(() => modal.contentEl.textContent.includes('검색 결과가 없습니다'));
	modal.close();
	await expect(pending).resolves.toBeUndefined();
	expect(write).not.toHaveBeenCalled();
});

it('keeps all release version declarations consistent', () => {
	const manifest = JSON.parse(readFileSync(join(__dirname, '..', 'manifest.json'), 'utf8'));
	const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
	const versions = JSON.parse(readFileSync(join(__dirname, '..', 'versions.json'), 'utf8'));
	expect(manifest.version).toBe(pkg.version);
	expect(versions[manifest.version]).toBe(manifest.minAppVersion);
});
