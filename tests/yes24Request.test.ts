import {requestUrl} from 'obsidian';
import {requestText} from '../src/yes24Request';
it('reports HTTP errors and network failures',async()=>{
	(requestUrl as jest.Mock).mockResolvedValue({status:503});await expect(requestText('https://www.yes24.com')).rejects.toThrow('503');
	(requestUrl as jest.Mock).mockRejectedValue(new Error('offline'));await expect(requestText('https://www.yes24.com')).rejects.toThrow('offline');
});
it('times out instead of leaving loading pending',async()=>{
	jest.useFakeTimers();(requestUrl as jest.Mock).mockReturnValue(new Promise(()=>{}));
	const outcome=expect(requestText('https://www.yes24.com')).rejects.toThrow('시간이 초과');
	jest.advanceTimersByTime(15000);await outcome;expect(jest.getTimerCount()).toBe(0);jest.useRealTimers();
});

it('cleans up the timeout after a successful request', async () => {
	jest.useFakeTimers();
	try {
		(requestUrl as jest.Mock).mockResolvedValue({ status: 200, text: 'OK' });
		await expect(requestText('https://www.yes24.com')).resolves.toBe('OK');
		expect(jest.getTimerCount()).toBe(0);
	} finally { jest.useRealTimers(); }
});

it('ignores a response after timeout and permits a subsequent request', async () => {
	jest.useFakeTimers();
	try {
		let resolve: (value: unknown) => void;
		(requestUrl as jest.Mock).mockReturnValueOnce(new Promise(r => { resolve = r; }));
		const pending = expect(requestText('https://www.yes24.com')).rejects.toThrow('초과');
		jest.advanceTimersByTime(15000);
		await pending;
		resolve({ status: 200, text: 'late' });
		(requestUrl as jest.Mock).mockResolvedValueOnce({ status: 200, text: 'new' });
		await expect(requestText('https://www.yes24.com')).resolves.toBe('new');
		expect(jest.getTimerCount()).toBe(0);
	} finally { jest.useRealTimers(); }
});

it.each([403, 404, 429, 500])('reports HTTP %s without trying to parse a blocked page', async status => {
	(requestUrl as jest.Mock).mockResolvedValue({ status, text: '<html>blocked</html>' });
	await expect(requestText('https://www.yes24.com')).rejects.toThrow(String(status));
});
