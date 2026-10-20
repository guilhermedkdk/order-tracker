/**
 * Stands in for the browser's EventSource, which jsdom lacks. Tests find the open streams with
 * `openStream` and play the API's part with `open`, `emit`, `drop` and `refuse`.
 */
export class FakeEventSource extends EventTarget {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSED = 2

  readonly url: string
  readyState = FakeEventSource.CONNECTING

  constructor(url: string | URL) {
    super()
    this.url = String(url)
    streams.add(this)
  }

  close(): void {
    this.readyState = FakeEventSource.CLOSED
    streams.delete(this)
  }

  open(): void {
    this.readyState = FakeEventSource.OPEN
    this.dispatchEvent(new Event('open'))
  }

  emit(type: string, data: unknown): void {
    this.dispatchEvent(new MessageEvent(type, { data: JSON.stringify(data) }))
  }

  /** The connection fell; the browser keeps the stream and reconnects by itself. */
  drop(): void {
    this.readyState = FakeEventSource.CONNECTING
    this.dispatchEvent(new Event('error'))
  }

  /** The API answered with an error status, as with an expired session: the browser gives up. */
  refuse(): void {
    this.readyState = FakeEventSource.CLOSED
    streams.delete(this)
    this.dispatchEvent(new Event('error'))
  }
}

const streams = new Set<FakeEventSource>()

/** The open stream on `path`, as the app sees it under `/api`. */
export function openStream(path: string): FakeEventSource {
  const found = [...streams].find((stream) => new URL(stream.url).pathname === `/api${path}`)
  if (!found) {
    throw new Error(`No stream open on ${path}.`)
  }
  return found
}

/** How many streams the app has open now. */
export function openStreamCount(): number {
  return streams.size
}

export function closeAllStreams(): void {
  streams.clear()
}
