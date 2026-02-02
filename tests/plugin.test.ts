import KrBookInfo from '../main';
import { App, Vault, FileManager, PluginSettingTab, Notice } from 'obsidian';
import * as getBookModule from '../src/getBook';

// Mock specific methods of the obsidian module used in main.ts
// Note: most mocks are now in __mocks__/obsidian.ts.
jest.mock('obsidian');

describe('KrBookInfo Integration', () => {
    let plugin: KrBookInfo;
    let mockApp: App;
    let mockVault: Vault;
    let mockFileManager: FileManager;

    beforeEach(() => {
        mockVault = {
            read: jest.fn(),
            modify: jest.fn(),
            getAbstractFileByPath: jest.fn()
        } as unknown as Vault;

        mockFileManager = {
            renameFile: jest.fn()
        } as unknown as FileManager;

        mockApp = {
            vault: mockVault,
            fileManager: mockFileManager,
            workspace: {
                getActiveFile: jest.fn()
            }
        } as unknown as App;

        plugin = new KrBookInfo(mockApp, {} as any);
        (plugin as any).app = mockApp;
        plugin.settings = {
            statusSetting: 'Status',
            myRateSetting: '5',
            bookNoteSetting: 'Note',
            defaultTag: 'Tag',
            toggleTitle: true,
            toggleIntroduction: false,
            toggleIndex: false
        };

        jest.clearAllMocks();
    });

    it('should add book info to active file', async () => {
        // Mock getBook to return success
        jest.spyOn(getBookModule, 'getBook').mockResolvedValue({
            ok: true,
            book: { title: 'New Title', main: 'New Content' }
        });

        // Mock active file
        const mockFile = {
            extension: 'md',
            basename: 'Book Search Query',
            parent: { path: 'folder' },
            path: 'folder/Book Search Query.md'
        };
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(mockFile);
        (mockApp.vault.read as jest.Mock).mockResolvedValue('Original Text');

        await plugin.addBookInfoToActiveFile();

        // Verify getBook was called with correct params
        expect(getBookModule.getBook).toHaveBeenCalledWith(expect.objectContaining({
            bookname: 'Book Search Query',
            defaultTag: 'Tag'
        }));

        // Verify vault.modify was called with content appended
        expect(mockVault.modify).toHaveBeenCalledWith(
            mockFile,
            'New Content\n\nOriginal Text'
        );

        // Verify file rename
        expect(mockFileManager.renameFile).toHaveBeenCalledWith(
            undefined, // getAbstractFileByPath returns undefined here but that's what we mocked
            'folder/New Title.md'
        );

        expect(Notice).toHaveBeenCalledWith('Success!');
    });

    it('should show notice if not md file', async () => {
        const mockFile = { extension: 'txt' };
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(mockFile);

        await plugin.addBookInfoToActiveFile();

        expect(Notice).toHaveBeenCalledWith(expect.stringContaining('not md file'));
        expect(getBookModule.getBook).not.toHaveBeenCalled();
    });

    it('should show notice if no active file', async () => {
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(null);

        await plugin.addBookInfoToActiveFile();

        expect(Notice).toHaveBeenCalledWith(expect.stringContaining('no active file'));
        expect(getBookModule.getBook).not.toHaveBeenCalled();
    });

    it('should load settings and register commands on onload', async () => {
        plugin.addCommand = jest.fn();
        plugin.addRibbonIcon = jest.fn();
        plugin.addSettingTab = jest.fn();
        plugin.loadData = jest.fn().mockResolvedValue({ defaultTag: 'NewTag' });

        await plugin.onload();

        expect(plugin.settings.defaultTag).toBe('NewTag');
        expect(plugin.addCommand).toHaveBeenCalledWith(expect.objectContaining({
            id: 'add-book-info',
            name: 'Add Book Info'
        }));
        expect(plugin.addRibbonIcon).toHaveBeenCalledWith('lines-of-text', 'Add Book Info', expect.any(Function));
        expect(plugin.addSettingTab).toHaveBeenCalled();
    });

    it('should call addBookInfoToActiveFile when command callback is executed', async () => {
        let commandCallback: any;
        (plugin.addCommand as any) = jest.fn((command) => {
            commandCallback = command.callback;
        });
        plugin.addRibbonIcon = jest.fn();
        plugin.addSettingTab = jest.fn();
        plugin.loadData = jest.fn().mockResolvedValue({});
        plugin.addBookInfoToActiveFile = jest.fn();

        await plugin.onload();
        await commandCallback();

        expect(plugin.addBookInfoToActiveFile).toHaveBeenCalled();
    });

    it('should call addBookInfoToActiveFile when ribbon icon callback is executed', async () => {
        let ribbonCallback: any;
        (plugin.addCommand as any) = jest.fn();
        (plugin.addRibbonIcon as any) = jest.fn((icon, title, callback) => {
            ribbonCallback = callback;
        });
        plugin.addSettingTab = jest.fn();
        plugin.loadData = jest.fn().mockResolvedValue({});
        plugin.addBookInfoToActiveFile = jest.fn();

        await plugin.onload();
        await ribbonCallback({} as MouseEvent);

        expect(plugin.addBookInfoToActiveFile).toHaveBeenCalled();
    });

    it('should handle getBook error', async () => {
        jest.spyOn(getBookModule, 'getBook').mockResolvedValue({
            ok: false,
            error: 'Book not found'
        });

        const mockFile = {
            extension: 'md',
            basename: 'Nonexistent Book',
            parent: { path: 'folder' },
            path: 'folder/Nonexistent Book.md'
        };
        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(mockFile);

        await plugin.addBookInfoToActiveFile();

        expect(Notice).toHaveBeenCalledWith('Book not found');
        expect(mockVault.modify).not.toHaveBeenCalled();
        expect(mockFileManager.renameFile).not.toHaveBeenCalled();
    });

    it('should save settings correctly', async () => {
        plugin.saveData = jest.fn();
        plugin.settings.defaultTag = 'NewTag';

        await plugin.saveSettings();

        expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
    });
});
