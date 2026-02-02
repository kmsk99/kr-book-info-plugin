import { getBook } from '../src/getBook';
import * as searchUrlModule from '../src/searchUrl';
import * as getBookInfoModule from '../src/getBookInfo';

describe('getBook', () => {
    // We mock the modules that getBook calls
    jest.spyOn(searchUrlModule, 'getBookUrl');
    jest.spyOn(getBookInfoModule, 'getBookInfoResult');

    const mockGetBookUrl = searchUrlModule.getBookUrl as jest.Mock;
    const mockGetBookInfoResult = getBookInfoModule.getBookInfoResult as jest.Mock;

    beforeEach(() => {
        mockGetBookUrl.mockClear();
        mockGetBookInfoResult.mockClear();
    });

    it('should return book data when both search and info retrieval succeed', async () => {
        mockGetBookUrl.mockResolvedValue({ ok: true, url: '/test-url' });
        mockGetBookInfoResult.mockResolvedValue({
            ok: true,
            book: { title: 'Test Book', main: 'Content' }
        });

        const result = await getBook({
            bookname: 'Test',
            defaultTag: 'Tag',
            status: 'Done',
            myRate: '5',
            bookNote: '',
            toggleTitle: true,
            toggleIntroduction: false,
            toggleIndex: false
        });

        expect(result.ok).toBe(true);
        expect(result.book).toEqual({ title: 'Test Book', main: 'Content' });
        expect(mockGetBookUrl).toHaveBeenCalledWith('Test');
        expect(mockGetBookInfoResult).toHaveBeenCalledWith(expect.objectContaining({
            bookUrl: '/test-url'
        }));
    });

    it('should return error if search fails', async () => {
        mockGetBookUrl.mockResolvedValue({ ok: false });

        const result = await getBook({
            bookname: 'Fail',
            defaultTag: '',
            status: '',
            myRate: '',
            bookNote: '',
            toggleTitle: false,
            toggleIntroduction: false,
            toggleIndex: false
        });

        expect(result.ok).toBe(false);
        expect(result.error).toContain('url not found');
        expect(mockGetBookInfoResult).not.toHaveBeenCalled();
    });

    it('should return error if info retrieval fails', async () => {
        mockGetBookUrl.mockResolvedValue({ ok: true, url: '/test-url' });
        mockGetBookInfoResult.mockResolvedValue({ ok: false });

        const result = await getBook({
            bookname: 'Test',
            defaultTag: '',
            status: '',
            myRate: '',
            bookNote: '',
            toggleTitle: false,
            toggleIntroduction: false,
            toggleIndex: false
        });

        expect(result.ok).toBe(false);
        expect(result.error).toContain('error occured');
    });
});
