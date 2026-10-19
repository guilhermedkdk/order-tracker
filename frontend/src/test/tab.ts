let hidden = false

Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })

/** Puts the tab in the background or brings it back, as switching tabs does. */
export function setTabHidden(next: boolean): void {
  hidden = next
  document.dispatchEvent(new Event('visibilitychange'))
}

export function resetTab(): void {
  hidden = false
}
