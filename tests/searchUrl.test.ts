import { getBookUrl } from '../src/searchUrl';
import { requestUrl } from 'obsidian';

describe('searchUrl', () => {
  const mockRequestUrl = requestUrl as jest.Mock;

  beforeEach(() => {
    mockRequestUrl.mockClear();
  });

  it('should return url from yes24 bulletsearch API if found', async () => {
    const mockResponse = {
      text: JSON.stringify({
        lstSearchKeywordResult: [
          { GOODDS_INDEXES: { GOODS_NO: '123456' } }
        ]
      })
    };
    mockRequestUrl.mockResolvedValue(mockResponse);

    const result = await getBookUrl('some book');

    expect(result.ok).toBe(true);
    expect(result.url).toBe('/Product/Goods/123456');
    expect(mockRequestUrl).toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringContaining('bulletsearch')
    }));
  });

  it('should return url from total search HTML if API fails or returns no result', async () => {
    // First call (API) throws error or returns empty
    mockRequestUrl.mockImplementationOnce(() => Promise.reject('API Error'));

    // Second call (Total Search) returns HTML
    // Selector used: #yesSchList > li:nth-child(1) > div > div.item_info > div.info_row.info_name > a.gd_name
    const mockHtml = `
      <html>
        <body>
          <ul id="yesSchList">
            <li>
               <div>
                  <div class="item_info">
                     <div class="info_row info_name">
                       <a class="gd_name" href="/Product/Goods/987654">Book Title</a>
                     </div>
                  </div>
               </div>
            </li>
          </ul>
        </body>
      </html>
    `;
    mockRequestUrl.mockResolvedValueOnce({ text: mockHtml });

    const result = await getBookUrl('some book');

    if (!result.ok) {
      console.error('Test failed to get URL from Html');
    }

    expect(result.ok).toBe(true);
    expect(result.url).toBe('/Product/Goods/987654');
  });

  it('should return ok: false if both searches fail', async () => {
    mockRequestUrl.mockRejectedValue(new Error('Network Error'));

    const result = await getBookUrl('fail book');

    expect(result.ok).toBe(false);
  });
});
