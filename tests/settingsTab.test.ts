import KrBookInfo, { KrBookInfoSettingTab } from '../main';

let plugin: KrBookInfo;
let tab: KrBookInfoSettingTab;
beforeEach(async () => {
	plugin = new KrBookInfo({} as any, {} as any);
	await plugin.loadSettings();
	plugin.saveSettings = jest.fn().mockResolvedValue(undefined);
	tab = new KrBookInfoSettingTab(plugin.app, plugin);
	tab.display();
});

it('renders all seven settings with their current values', () => {
	expect(tab.containerEl.querySelectorAll('input')).toHaveLength(7);
	expect(tab.containerEl.querySelector<HTMLInputElement>('[data-name="Tag"] input')!.value).toBe('📚독서');
	expect(tab.containerEl.querySelector<HTMLInputElement>('[data-name="Toggle Title"] input')!.checked).toBe(true);
	expect(tab.containerEl.querySelector<HTMLInputElement>('[data-name="Toggle Introduction"] input')!.checked).toBe(false);
});

it.each([
	['Tag', 'defaultTag', '내 책'],
	['Status', 'statusSetting', '읽는 중'],
	['My Rate', 'myRateSetting', '4.5'],
	['Book Note', 'bookNoteSetting', '메모'],
])('persists a change to %s', (label, key, value) => {
	const input = tab.containerEl.querySelector<HTMLInputElement>(`[data-name="${label}"] input`)!;
	input.value = value;
	input.dispatchEvent(new Event('input'));
	expect((plugin.settings as any)[key]).toBe(value);
	expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
});

it.each([
	['Toggle Title', 'toggleTitle'],
	['Toggle Introduction', 'toggleIntroduction'],
	['Toggle Index', 'toggleIndex'],
])('persists both directions of %s', (label, key) => {
	const input = tab.containerEl.querySelector<HTMLInputElement>(`[data-name="${label}"] input`)!;
	for (const value of [true, false]) {
		input.checked = value;
		input.dispatchEvent(new Event('change'));
		expect((plugin.settings as any)[key]).toBe(value);
	}
	expect(plugin.saveSettings).toHaveBeenCalledTimes(2);
});

it('reopening settings does not duplicate controls or listeners', () => {
	tab.display();
	expect(tab.containerEl.querySelectorAll('input')).toHaveLength(7);
	const input = tab.containerEl.querySelector<HTMLInputElement>('[data-name="Tag"] input')!;
	input.value = '';
	input.dispatchEvent(new Event('input'));
	expect(plugin.settings.defaultTag).toBe('');
	expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
});
