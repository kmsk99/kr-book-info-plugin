import { Notice, Plugin } from "obsidian";
import { getBook } from "src/crawler";

export default class KrBookInfo extends Plugin {
	async onload() {
		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"lines-of-text",
			"Add Book Info",
			async (evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("Loading...");

				// check current active file
				const file = this.app.workspace.getActiveFile();

				// Search book through current file's title
				const [title, result] = await getBook(file.basename);

				// check file's text
				const text = await this.app.vault.read(file);

				// join Frontmatter And text
				this.app.vault.modify(file, result + "\n\n" + text);

				console.log(file.parent.path);
				console.log(file.parent.path + "/" + title + ".md");

				// change file name
				this.app.fileManager.renameFile(
					this.app.vault.getAbstractFileByPath(file.path),
					file.parent.path + "/" + title + ".md"
				);

				new Notice("Success!");
			}
		);
	}

	onunload() {}
}
