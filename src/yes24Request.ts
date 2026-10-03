import { requestUrl } from 'obsidian';

/** requestUrl works on desktop and mobile without browser CORS or user cookies. */
export async function requestText(url: string): Promise<string> {
	let timer: ReturnType<typeof setTimeout>;
	try {
		const response = await Promise.race([
			requestUrl({ url, throw: false }),
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error('YES24 응답 시간이 초과되었습니다. 다시 시도해 주세요.')), 15000);
			}),
		]);
		if (response.status !== 200) throw new Error(`YES24 요청에 실패했습니다 (HTTP ${response.status}).`);
		return response.text;
	} finally {
		clearTimeout(timer);
	}
}
