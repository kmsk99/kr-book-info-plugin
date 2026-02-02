import { getBookInfoResult } from '../src/getBookInfo';
import { requestUrl } from 'obsidian';

describe('getBookInfo', () => {
    const mockRequestUrl = requestUrl as jest.Mock;

    beforeEach(() => {
        mockRequestUrl.mockClear();
    });

    it('should parse book info correctly from HTML', async () => {
        const mockHtml = `
      <html>
        <body>
            <div id="infoset_goodsCate">
                <div class="infoSetCont_wrap">
                    <dl><dd><ul><li><a>Category1</a></li></ul></dd></dl>
                </div>
            </div>
            <div id="yDetailTopWrap">
                <div class="topColRgt">
                    <div class="gd_infoTop">
                        <div>
                            <h2>Main Title</h2>
                            <h3>Sub Title</h3>
                        </div>
                        <span class="gd_pubArea">
                            <span class="gd_auth">
                                <a>Author One</a>
                                <span><span class="moreAuthLi"><span><ul><li><a>Author Two</a></li></ul></span></span></span>
                            </span>
                            <span class="gd_date">2023년 1월 1일</span>
                        </span>
                    </div>
                </div>
                <div class="topColLft">
                     <div><span class="gd_img"><em><img src="http://example.com/cover.jpg"></em></span></div>
                </div>
            </div>
            <div id="infoset_specific">
                <div class="infoSetCont_wrap">
                     <div><table><tbody><tr></tr><tr><td>300쪽</td></tr></tbody></table></div>
                </div>
            </div>
            <div id="infoset_introduce">
                <div class="infoSetCont_wrap"><div class="infoWrap_txt"><div>Introduction text</div></div></div>
            </div>
            <div id="infoset_toc">
                 <div class="infoSetCont_wrap"><div class="infoWrap_txt">Table of Contents</div></div>
            </div>
        </body>
      </html>
    `;

        mockRequestUrl.mockResolvedValue({ text: mockHtml });

        const result = await getBookInfoResult({
            bookUrl: '/test-book',
            defaultTag: 'Tag',
            status: 'Reading',
            myRate: '5',
            bookNote: 'Note',
            toggleTitle: true,
            toggleIntroduction: true,
            toggleIndex: true
        });

        expect(result.ok).toBe(true);
        expect(result.book).toBeDefined();
        if (result.book) {
            expect(result.book.title).toContain('Main Title');
            expect(result.book.title).toContain('Sub Title');
            expect(result.book.main).toContain('Category1');
            expect(result.book.main).toContain('Author One, Author Two');
            expect(result.book.main).toContain('2023-1-1');
            expect(result.book.main).toContain('300'); // pages
            expect(result.book.main).toContain('Introduction text');
            expect(result.book.main).toContain('Table of Contents');
        }
    });

    it('should handle errors gracefully', async () => {
        mockRequestUrl.mockRejectedValue(new Error('Network Error'));

        const result = await getBookInfoResult({
            bookUrl: '/fail-book',
            defaultTag: '',
            status: '',
            myRate: '',
            bookNote: '',
            toggleTitle: false,
            toggleIntroduction: false,
            toggleIndex: false
        });

        expect(result.ok).toBe(false);
    });
});
