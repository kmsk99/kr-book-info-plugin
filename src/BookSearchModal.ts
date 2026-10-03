import { App, Modal } from 'obsidian';
import { BOOK_DOMAINS, BookCandidate, BookDomain, searchBooks } from './searchUrl';

/** Native Modal, with explicit search and pagination to avoid requests on every keystroke. */
export class BookSearchModal extends Modal {
	private resolve: (book: BookCandidate | null) => void;
	private settled = false;
	private generation = 0;
	private query: HTMLInputElement;
	private domain: HTMLSelectElement;
	private status: HTMLElement;
	private results: HTMLElement;
	private previous: HTMLButtonElement;
	private next: HTMLButtonElement;
	private page = 1;
	private searchedQuery = '';
	private searchedDomain: BookDomain = 'BOOK';

	constructor(app: App, private initialQuery: string) { super(app); }

	choose(): Promise<BookCandidate | null> {
		return new Promise(resolve => { this.resolve = resolve; this.open(); });
	}

	onOpen() {
		this.contentEl.addClass('kr-book-search');
		this.contentEl.createEl('h2', { text: '도서 선택' });
		this.contentEl.createEl('p', { text: '제목·저자·출판사와 판본을 확인한 뒤 가져올 책을 선택하세요.', cls: 'kr-book-hint' });
		const form = this.contentEl.createEl('form', { cls: 'kr-book-search-form' });
		this.query = form.createEl('input', { type: 'search', value: this.initialQuery, attr: { 'aria-label': '책 제목, 저자 또는 ISBN', placeholder: '책 제목, 저자 또는 ISBN' } });
		this.domain = form.createEl('select', { attr: { 'aria-label': '도서 종류' } });
		(Object.keys(BOOK_DOMAINS) as BookDomain[]).forEach(key => this.domain.createEl('option', { value: key, text: BOOK_DOMAINS[key] }));
		form.createEl('button', { text: '검색', type: 'submit', cls: 'mod-cta' });
		form.addEventListener('submit', event => { event.preventDefault(); void this.search(1); });
		this.domain.addEventListener('change', () => { void this.search(1); });
		// Invalidate old results immediately when the search terms change.
		this.query.addEventListener('input', () => {
			this.generation++;
			this.results.empty(); this.previous.disabled = this.next.disabled = true;
			this.status.setText('Enter 또는 검색 버튼을 눌러 검색하세요.');
		});
		this.status = this.contentEl.createEl('p', { attr: { role: 'status', 'aria-live': 'polite' } });
		this.results = this.contentEl.createDiv({ cls: 'kr-book-results' });
		const footer = this.contentEl.createDiv({ cls: 'kr-book-pagination' });
		this.previous = footer.createEl('button', { text: '이전', type: 'button' });
		this.next = footer.createEl('button', { text: '다음', type: 'button' });
		this.previous.addEventListener('click', () => { void this.search(this.page - 1); });
		this.next.addEventListener('click', () => { void this.search(this.page + 1); });
		footer.createEl('button', { text: '취소', type: 'button' }).addEventListener('click', () => this.close());
		this.query.focus(); this.query.select();
		void this.search(1);
	}

	private async search(page: number) {
		const generation = ++this.generation;
		const query = page === 1 ? this.query.value.trim() : this.searchedQuery;
		const domain = page === 1 ? this.domain.value as BookDomain : this.searchedDomain;
		this.results.empty(); this.previous.disabled = this.next.disabled = true;
		if (!query) { this.status.setText('검색할 책 제목, 저자 또는 ISBN을 입력하세요.'); return; }
		this.status.setText('YES24에서 검색 중…');
		try {
			const result = await searchBooks(query, page, domain);
			if (generation !== this.generation || this.settled) return;
			this.page = page; this.searchedQuery = query; this.searchedDomain = domain;
			this.status.setText(result.books.length ? `${result.total.toLocaleString()}개 결과 · ${page}페이지` : '검색 결과가 없습니다. 검색어나 도서 종류를 바꿔 보세요.');
			for (const book of result.books) {
				const button = this.results.createEl('button', { type: 'button', cls: 'kr-book-result' });
				button.createEl('span', { text: book.title, cls: 'kr-book-result-title' });
				button.createEl('span', { text: [book.author, book.publisher, book.date].filter(Boolean).join(' · '), cls: 'kr-book-result-meta' });
				button.createEl('span', { text: [book.kind, book.edition].filter(Boolean).join(' · '), cls: 'kr-book-result-meta' });
				button.addEventListener('click', () => {
					if (this.settled) return;
					this.settled = true; this.resolve(book); this.close();
				});
			}
			this.previous.disabled = page <= 1; this.next.disabled = !result.hasMore;
			this.results.scrollTop = 0;
		} catch (error) {
			if (generation !== this.generation || this.settled) return;
			this.status.setText(error instanceof Error ? error.message : 'YES24 검색에 실패했습니다. 다시 시도해 주세요.');
		}
	}

	onClose() {
		this.generation++;
		if (!this.settled) { this.settled = true; this.resolve?.(null); }
		this.contentEl.empty();
	}
}
