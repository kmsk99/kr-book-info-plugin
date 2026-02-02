import KrBookInfo, { KrBookInfoSettingTab } from '../main';
import { App } from 'obsidian';

jest.mock('obsidian');

describe('KrBookInfoSettingTab', () => {
    let plugin: KrBookInfo;
    let mockApp: App;
    let settingsTab: KrBookInfoSettingTab;

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
        plugin.saveSettings = jest.fn();
        
        settingsTab = new KrBookInfoSettingTab(mockApp, plugin);
    });

    it('should create settings tab instance', () => {
        expect(settingsTab).toBeDefined();
        expect(settingsTab.plugin).toBe(plugin);
    });

    it('should extend PluginSettingTab', () => {
        const { PluginSettingTab } = require('obsidian');
        expect(settingsTab).toBeInstanceOf(PluginSettingTab);
    });
});
