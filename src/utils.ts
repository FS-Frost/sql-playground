export async function waitUntil(conditionFunction: () => boolean, everyMs: number, untilMs: number | null): Promise<void> {
    return await new Promise((resolve, reject) => {
        let tries = 0;

        const interval = setInterval(() => {
            tries++;

            if (untilMs && tries * everyMs >= untilMs) {
                reject(`Timeout of ${untilMs} ms`);
                clearInterval(interval);
            }

            if (conditionFunction()) {
                resolve();
                clearInterval(interval);
            };
        }, everyMs);
    });
}
