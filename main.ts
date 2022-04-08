import { Notice, Plugin } from "obsidian";
import { getBook } from "src/crawler";

// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
	async onload() {
		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"lines-of-text",
			"Add Book Info",
			async (evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("Loading...");

				const file = this.app.workspace.getActiveFile();

				const [title, result] = await getBook(file.basename);

				const text = await this.app.vault.read(file);

				this.app.vault.modify(file, result + "\n\n" + text);

				this.app.fileManager.renameFile(
					this.app.vault.getAbstractFileByPath(file.path),
					file.parent.path + title + ".md"
				);

				new Notice("Success!");
			}
		);
	}

	onunload() {}
}
