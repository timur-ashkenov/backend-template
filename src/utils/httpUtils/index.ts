export async function safeJson(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        const text = await response.text().catch(() => '');

        return tryParseJson(text) ?? text ?? null;
    }
}

export function tryParseJson(input: string): unknown | null {
    try {
        return JSON.parse(input);
    } catch {
        return null;
    }
}

export function mergeAbortSignals(signals: AbortSignal[]): AbortSignal {
    if (signals.length < 1) return new AbortController().signal;
    
    if (signals.length === 1) return signals[0];

    const controller = new AbortController();

    const onAbort = () => controller.abort();

    for (const signal of signals) {
        if (signal.aborted) {
            controller.abort();

            return controller.signal;
        }
        signal.addEventListener('abort', onAbort, { once: true });
    }

    return controller.signal;
}

export function collectAbortSignals(
    primary: AbortSignal,
    extra?: AbortSignal
): AbortSignal[] {
    if (!extra) return [primary];

    return [primary, extra];
}
