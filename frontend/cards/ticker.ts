type TickListener = () => void;

const listeners = new Set<TickListener>();
let timer: number | undefined;

/** Calls the listener once a second; one shared interval runs only while anyone is subscribed. Returns the unsubscribe function. */
export function subscribeTicker(listener: TickListener): () => void {
    listeners.add(listener);
    timer ??= window.setInterval(() => listeners.forEach(l => l()), 1000);

    return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && timer !== undefined) {
            window.clearInterval(timer);
            timer = undefined;
        }
    };
}
