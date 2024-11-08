/**
 * Whether the current page is loaded in an iframe.
 */
export function isIframed(): boolean {
  return window.self !== window.top;
}
