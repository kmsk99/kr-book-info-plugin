// Polyfill for Element.prototype.getText which is provided by Obsidian
Element.prototype.getText = function () {
    return this.textContent || '';
};

HTMLElement.prototype.empty = function() { this.replaceChildren(); };
HTMLElement.prototype.setText = function(text) { this.textContent = text; };
HTMLElement.prototype.addClass = function(name) { this.classList.add(name); };
HTMLElement.prototype.createEl = function(tag, options = {}) {
    const el = document.createElement(tag);
    if (options.text) el.textContent = options.text;
    if (options.cls) el.className = options.cls;
    for (const key of ['type', 'value']) if (options[key]) el[key] = options[key];
    for (const [key, value] of Object.entries(options.attr || {})) el.setAttribute(key, value);
    this.append(el);
    return el;
};
HTMLElement.prototype.createDiv = function(options = {}) { return this.createEl('div', options); };
