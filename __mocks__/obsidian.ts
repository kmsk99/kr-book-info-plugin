export const requestUrl = jest.fn();
export const stringifyYaml = jest.fn((obj) => JSON.stringify(obj));
export const Notice = jest.fn();

export class Plugin {
    app: any;
    manifest: any;
    settings: any;

    constructor(app: any, manifest: any) {
        this.app = app;
        this.manifest = manifest;
        this.settings = {};
    }

    async loadData() {
        return {};
    }

    async saveData(data: any) {
        return;
    }

    addCommand(command: any) { 
        return this;
    }
    addRibbonIcon(icon: string, title: string, callback: any) { 
        return this;
    }
    addSettingTab(settingTab: any) { 
        return this;
    }
}

export class PluginSettingTab {
    app: any;
    plugin: any;
    containerEl: any;

    constructor(app: any, plugin: any) {
        this.app = app;
        this.plugin = plugin;
        this.containerEl = {
            empty: jest.fn(),
            createEl: jest.fn(),
        }
    }

    display() { }
}

export class Setting {
    private textCallbacks: ((text: any) => void)[] = [];
    private toggleCallbacks: ((toggle: any) => void)[] = [];

    constructor(containerEl: any) { }
    
    setName(name: string) { return this; }
    setDesc(desc: string) { return this; }
    
    addText(cb: any) { 
        this.textCallbacks.push(cb);
        const mockText: any = {
            setPlaceholder: jest.fn().mockReturnThis(),
            setValue: jest.fn().mockReturnThis(),
            onChange: jest.fn((onChangeCb: any) => {
                mockText.onChangeCallback = onChangeCb;
                return mockText;
            })
        };
        cb(mockText);
        return this; 
    }
    
    addToggle(cb: any) {
        this.toggleCallbacks.push(cb);
        const mockToggle: any = {
            setValue: jest.fn().mockReturnThis(),
            onChange: jest.fn((onChangeCb: any) => {
                mockToggle.onChangeCallback = onChangeCb;
                return mockToggle;
            })
        };
        cb(mockToggle);
        return this; 
    }
}
