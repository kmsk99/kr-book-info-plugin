export const requestUrl = jest.fn();
export const Notice = jest.fn().mockImplementation(() => ({ hide: jest.fn() }));

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
        this.containerEl = document.createElement('div');
    }

    display() { }
}

export class Setting {
    row: HTMLElement;
    constructor(containerEl: HTMLElement) {
        this.row = document.createElement('label');
        containerEl.append(this.row);
    }
    setName(name: string) { this.row.dataset.name = name; return this; }
    setDesc(desc: string) { this.row.title = desc; return this; }
    addText(cb: any) {
        const input = document.createElement('input');
        this.row.append(input);
        const control = {
            setPlaceholder: (value: string) => { input.placeholder = value; return control; },
            setValue: (value: string) => { input.value = value; return control; },
            onChange: (handler: (value: string) => void) => {
                input.addEventListener('input', () => handler(input.value));
                return control;
            }
        };
        cb(control); return this;
    }
    addToggle(cb: any) {
        const input = document.createElement('input'); input.type = 'checkbox';
        this.row.append(input);
        const control = {
            setValue: (value: boolean) => { input.checked = value; return control; },
            onChange: (handler: (value: boolean) => void) => {
                input.addEventListener('change', () => handler(input.checked));
                return control;
            }
        };
        cb(control); return this;
    }
}

export const normalizePath = (path: string) => path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\//, '');
export const getFrontMatterInfo = (text: string) => {
    const match = text.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/);
    return { contentStart: match ? match[0].length : 0 };
};
export class Modal {
    contentEl = document.createElement('div');
    constructor(public app: any) {}
    open() { this.onOpen(); }
    close() { this.onClose(); }
    onOpen() {}
    onClose() {}
}
