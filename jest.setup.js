// Polyfill for Element.prototype.getText which is provided by Obsidian
Element.prototype.getText = function () {
    return this.textContent || '';
};
