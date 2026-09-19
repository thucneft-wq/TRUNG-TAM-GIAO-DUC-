interface InFlightRequest<Value> {
  controller: AbortController;
  promise: Promise<Value>;
  consumers: Set<symbol>;
}

const createAbortError = (reason?: unknown): DOMException =>
  new DOMException(
    typeof reason === 'string' ? reason : 'The operation was aborted.',
    'AbortError',
  );

export class SharedRequestPool<Key, Value> {
  private readonly entries = new Map<Key, InFlightRequest<Value>>();

  run(
    key: Key,
    factory: (signal: AbortSignal) => Promise<Value>,
    signal?: AbortSignal,
  ): Promise<Value> {
    let entry = this.entries.get(key);
    if (!entry) {
      const controller = new AbortController();
      const nextEntry: InFlightRequest<Value> = {
        controller,
        consumers: new Set(),
        promise: Promise.resolve().then(() => factory(controller.signal)),
      };
      nextEntry.promise = nextEntry.promise.finally(() => {
        if (this.entries.get(key) === nextEntry) this.entries.delete(key);
      });
      this.entries.set(key, nextEntry);
      entry = nextEntry;
    }

    const consumer = Symbol(String(key));
    entry.consumers.add(consumer);

    return new Promise<Value>((resolve, reject) => {
      let settled = false;
      const release = () => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', handleAbort);
        entry?.consumers.delete(consumer);
      };
      const handleAbort = () => {
        release();
        if (entry && entry.consumers.size === 0) entry.controller.abort(signal?.reason);
        reject(createAbortError(signal?.reason));
      };

      if (signal?.aborted) {
        handleAbort();
        return;
      }
      signal?.addEventListener('abort', handleAbort, { once: true });

      entry.promise.then(
        (value) => {
          if (settled) return;
          release();
          resolve(value);
        },
        (error: unknown) => {
          if (settled) return;
          release();
          reject(error);
        },
      );
    });
  }

  abort(key: Key, reason = 'Request replaced by a retry.'): void {
    const entry = this.entries.get(key);
    if (!entry) return;
    this.entries.delete(key);
    entry.controller.abort(reason);
  }

  has(key: Key): boolean {
    return this.entries.has(key);
  }
}
