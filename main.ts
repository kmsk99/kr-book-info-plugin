import { Notice, Plugin } from "obsidian";
import { getBook } from "src/crawler";

export default class KrBookInfo extends Plugin {
	async onload() {
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
				const [title, result] = await getBook(file.basename);

				// check file's text
				const text = await this.app.vault.read(file);

				// join Frontmatter And text
				this.app.vault.modify(file, result + "\n\n" + text);

				const regExp =
					/[\{\}\[\]\/?.,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi;

				// sanitizing the title
				const fileName = title.replace(regExp, "");

				// change file name
				this.app.fileManager.renameFile(
					this.app.vault.getAbstractFileByPath(file.path),
					file.parent.path + "/" + fileName + ".md"
				);

				new Notice("Success!");

				return;
			}
		);
	}

	onunload() {}
}
