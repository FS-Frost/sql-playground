export async function waitUntil(conditionFunction: () => boolean, everyMs: number, untilMs: number | null): Promise<boolean> {
    return await new Promise((resolve, reject) => {
        let tries = 0;

        const interval = setInterval(() => {
            tries++;

            if (untilMs && tries * everyMs >= untilMs) {
                resolve(false);
                clearInterval(interval);
            }

            if (conditionFunction()) {
                resolve(true);
                clearInterval(interval);
            };
        }, everyMs);
    });
}
