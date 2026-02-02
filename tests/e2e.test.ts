import KrBookInfo from '../main';
import { App, Setting } from 'obsidian';
import * as getBookModule from '../src/getBook';

jest.mock('obsidian');

describe('E2E: Complete Book Info Flow', () => {
    let plugin: KrBookInfo;
    let mockApp: App;

    beforeEach(() => {
        const mockVault = {
            read: jest.fn(),
            modify: jest.fn(),
            getAbstractFileByPath: jest.fn()
        };

        const mockFileManager = {
            renameFile: jest.fn()
        };

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
            statusSetting: 'Reading',
            myRateSetting: '5',
            bookNoteSetting: 'Yes',
            defaultTag: 'Books',
            toggleTitle: true,
            toggleIntroduction: true,
            toggleIndex: true
        };

        jest.clearAllMocks();
    });

    it('should complete full book info workflow from search to file update', async () => {
        jest.spyOn(getBookModule, 'getBook').mockResolvedValue({
            ok: true,
            book: {
                title: 'Test Book Title',
                main: '---\ntitle: Test Book\n---\n\n# Test Book\n\nIntroduction\n\nIndex'
            }
        });

        const mockFile = {
            extension: 'md',
            basename: 'Search Query',
            parent: { path: 'Books' },
            path: 'Books/Search Query.md'
        };

        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(mockFile);
        (mockApp.vault.read as jest.Mock).mockResolvedValue('Original content');

        await plugin.addBookInfoToActiveFile();

        expect(getBookModule.getBook).toHaveBeenCalledWith({
            bookname: 'Search Query',
            defaultTag: 'Books',
            status: 'Reading',
            myRate: '5',
            bookNote: 'Yes',
            toggleTitle: true,
            toggleIntroduction: true,
            toggleIndex: true
        });

        expect(mockApp.vault.modify).toHaveBeenCalledWith(
            mockFile,
            expect.stringContaining('Test Book')
        );

        expect(mockApp.vault.modify).toHaveBeenCalledWith(
            mockFile,
            expect.stringContaining('Original content')
        );

        expect(mockApp.fileManager.renameFile).toHaveBeenCalled();
    });

    it('should handle workflow with different settings', async () => {
        plugin.settings = {
            statusSetting: 'Completed',
            myRateSetting: '4',
            bookNoteSetting: 'No',
            defaultTag: 'Library',
            toggleTitle: false,
            toggleIntroduction: false,
            toggleIndex: false
        };

        jest.spyOn(getBookModule, 'getBook').mockResolvedValue({
            ok: true,
            book: {
                title: 'Another Book',
                main: '---\ntitle: Another Book\n---'
            }
        });

        const mockFile = {
            extension: 'md',
            basename: 'Another Search',
            parent: { path: 'Library' },
            path: 'Library/Another Search.md'
        };

        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(mockFile);
        (mockApp.vault.read as jest.Mock).mockResolvedValue('');

        await plugin.addBookInfoToActiveFile();

        expect(getBookModule.getBook).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'Completed',
                myRate: '4',
                bookNote: 'No',
                defaultTag: 'Library',
                toggleTitle: false,
                toggleIntroduction: false,
                toggleIndex: false
            })
        );
    });

    it('should handle complete error scenarios in workflow', async () => {
        jest.spyOn(getBookModule, 'getBook').mockResolvedValue({
            ok: false,
            error: 'Network error occurred'
        });

        const mockFile = {
            extension: 'md',
            basename: 'Failing Book',
            parent: { path: 'folder' },
            path: 'folder/Failing Book.md'
        };

        (mockApp.workspace.getActiveFile as jest.Mock).mockReturnValue(mockFile);

        await plugin.addBookInfoToActiveFile();

        expect(mockApp.vault.modify).not.toHaveBeenCalled();
        expect(mockApp.fileManager.renameFile).not.toHaveBeenCalled();
    });
});

describe('E2E: Settings Tab Integration', () => {
    let plugin: KrBookInfo;
    let mockApp: App;

    beforeEach(() => {
        mockApp = {} as unknown as App;
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
    });

    it('should create settings tab instance', () => {
        const settingTabInstance = new (require('../main').default as any);
        expect(settingTabInstance).toBeDefined();
    });

    it('should save and load settings correctly', async () => {
        plugin.loadData = jest.fn().mockResolvedValue({
            defaultTag: 'CustomTag',
            statusSetting: 'CustomStatus',
            myRateSetting: '3',
            bookNoteSetting: 'CustomNote',
            toggleTitle: false,
            toggleIntroduction: true,
            toggleIndex: true
        });

        await plugin.loadSettings();

        expect(plugin.settings.defaultTag).toBe('CustomTag');
        expect(plugin.settings.statusSetting).toBe('CustomStatus');
        expect(plugin.settings.myRateSetting).toBe('3');
        expect(plugin.settings.bookNoteSetting).toBe('CustomNote');
        expect(plugin.settings.toggleTitle).toBe(false);
        expect(plugin.settings.toggleIntroduction).toBe(true);
        expect(plugin.settings.toggleIndex).toBe(true);
    });

    it('should persist settings after save', async () => {
        plugin.saveData = jest.fn();
        plugin.settings.defaultTag = 'NewTag';
        plugin.settings.myRateSetting = '10';

        await plugin.saveSettings();

        expect(plugin.saveData).toHaveBeenCalledWith(
            expect.objectContaining({
                defaultTag: 'NewTag',
                myRateSetting: '10'
            })
        );
    });

    it('should use default settings when no saved data exists', async () => {
        plugin.loadData = jest.fn().mockResolvedValue({});

        await plugin.loadSettings();

        expect(plugin.settings.defaultTag).toBe('📚독서');
        expect(plugin.settings.statusSetting).toBe('🟩 완료');
        expect(plugin.settings.myRateSetting).toBe('0');
        expect(plugin.settings.bookNoteSetting).toBe('❌');
    });
});
