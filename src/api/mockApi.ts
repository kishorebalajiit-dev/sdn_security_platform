const DEFAULT_DELAY = 600;

export function mockDelay<T>(result: T, ms = DEFAULT_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(result), ms));
}

export function mockDelayVoid(ms = DEFAULT_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
