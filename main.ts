import {
	App,
	Component,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	ToggleComponent,
} from "obsidian";
import { getBook } from "src/getBook";

interface KrBookInfoSettings {
	statusSetting: string;
	myRateSetting: string;
	bookNoteSetting: string;
	defaultTag: string;
	toggleTitle: boolean;
}

const DEFAULT_SETTINGS: KrBookInfoSettings = {
	statusSetting: "🟩 완료",
	myRateSetting: "0",
	bookNoteSetting: "❌",
	defaultTag: "📚독서",
	toggleTitle: true,
};

export default class KrBookInfo extends Plugin {
	settings: KrBookInfoSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"lines-of-text",
			"Add Book Info",
			async (evt: MouseEvent) => {
				// check current active file
				const file = this.app.workspace.getActiveFile();

				if (file.extension !== "md") {
					new Notice("This file is not md file, Please open md file");
					return;
				}

				if (!file) {
					new Notice("There's no active file, Please open new file");
					return;
				}

				// Called when the user clicks the icon.
				new Notice("Loading...");

				// Search book through current file's title
				const {
					ok,
					book: { title, main },
					error,
				} = await getBook({
					bookname: file.basename,
					defaultTag: this.settings.defaultTag,
					status: this.settings.statusSetting,
					myRate: this.settings.myRateSetting,
					bookNote: this.settings.bookNoteSetting,
					toggleTitle: this.settings.toggleTitle,
				});

				if (!ok) {
					new Notice(error);
					return;
				}

				// check file's text
				const text = await this.app.vault.read(file);

				// join Frontmatter And text
				this.app.vault.modify(file, main + "\n\n" + text);

				const regExp =
					/[\{\}\[\]\/?.,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi;

				// sanitizing the title
				const fileName = title.replace(regExp, "");

				// change file name
				this.app.fileManager.renameFile(
					this.app.vault.getAbstractFileByPath(file.path),
					file.parent.path + "/" + fileName + ".md"
				);

				new Notice(`Success!`);

				return;
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

	onunload() {}
}

class KrBookInfoSettingTab extends PluginSettingTab {
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
	}
}
