import { App, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import { getBook } from "./src/getBook";
import { BookSearchModal } from "./src/BookSearchModal";
import { saveBook } from "./src/saveBook";

interface KrBookInfoSettings {
	statusSetting: string;
	myRateSetting: string;
	bookNoteSetting: string;
	defaultTag: string;
	toggleTitle: boolean;
	toggleIntroduction: boolean;
	toggleIndex: boolean;
}

const DEFAULT_SETTINGS: KrBookInfoSettings = {
	statusSetting: "🟩 완료",
	myRateSetting: "0",
	bookNoteSetting: "❌",
	defaultTag: "📚독서",
	toggleTitle: true,
	toggleIntroduction: false,
	toggleIndex: false,
};

export default class KrBookInfo extends Plugin {
	settings: KrBookInfoSettings;

	private busy = false;
	private unloaded = false;
	private searchModal: BookSearchModal | null = null;

	async addBookInfoToActiveFile() {
		if (this.busy || this.unloaded) return;
		const file = this.app.workspace.getActiveFile();
		if (!file) { new Notice("열린 노트가 없습니다. Markdown 노트를 열어 주세요."); return; }
		if (file.extension !== "md") { new Notice("Markdown 노트에서 실행해 주세요."); return; }
		this.busy = true;
		let loading: Notice | undefined;
		try {
			this.searchModal = new BookSearchModal(this.app, file.basename);
			const selected = await this.searchModal.choose();
			this.searchModal = null;
			if (!selected || this.unloaded) return;
			loading = new Notice("도서 정보를 가져오는 중…", 0);
			const book = await getBook(selected.id, this.settings);
			if (this.unloaded) return;
			await saveBook(this.app, file, book);
			if (!this.unloaded) new Notice("도서 정보를 저장했습니다.");
		} catch (error) {
			console.error("[kr-book-info]", error);
			new Notice(error instanceof Error ? error.message : "도서 정보를 가져오지 못했습니다. 다시 시도해 주세요.");
		} finally {
			loading?.hide();
			this.busy = false;
		}
	}

	async onload() {
		this.unloaded = false;
		await this.loadSettings();

		this.addCommand({
			id: "add-book-info",
			name: "Add Book Info",
			icon: "lines-of-text",
			callback: async () => {
				await this.addBookInfoToActiveFile();
			},
		});

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"lines-of-text",
			"Add Book Info",
			async (evt: MouseEvent) => {
				await this.addBookInfoToActiveFile();
			}
		);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new KrBookInfoSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
		this.unloaded = true;
		this.searchModal?.close();
	}
}

export class KrBookInfoSettingTab extends PluginSettingTab {
	plugin: KrBookInfo;

	constructor(app: App, plugin: KrBookInfo) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Default Setting" });

		new Setting(containerEl)
			.setName("Tag")
			.setDesc("Set default tag value")
			.addText((text) =>
				text
					.setPlaceholder("Enter your default tag")
					.setValue(this.plugin.settings.defaultTag)
					.onChange(async (value) => {
						this.plugin.settings.defaultTag = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Status")
			.setDesc("Set status default value")
			.addText((text) =>
				text
					.setPlaceholder("Enter your status")
					.setValue(this.plugin.settings.statusSetting)
					.onChange(async (value) => {
						this.plugin.settings.statusSetting = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("My Rate")
			.setDesc("Set my_rate default value")
			.addText((text) =>
				text
					.setPlaceholder("Enter your status")
					.setValue(this.plugin.settings.myRateSetting)
					.onChange(async (value) => {
						this.plugin.settings.myRateSetting = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Book Note")
			.setDesc("Set book_note default value")
			.addText((text) =>
				text
					.setPlaceholder("Enter your status")
					.setValue(this.plugin.settings.bookNoteSetting)
					.onChange(async (value) => {
						this.plugin.settings.bookNoteSetting = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Toggle Title")
			.setDesc("Add title on main text or not")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.toggleTitle)
					.onChange(async (value) => {
						this.plugin.settings.toggleTitle = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Toggle Introduction")
			.setDesc("Add introduction on main text or not")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.toggleIntroduction)
					.onChange(async (value) => {
						this.plugin.settings.toggleIntroduction = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Toggle Index")
			.setDesc("Add index on main text or not")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.toggleIndex)
					.onChange(async (value) => {
						this.plugin.settings.toggleIndex = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
