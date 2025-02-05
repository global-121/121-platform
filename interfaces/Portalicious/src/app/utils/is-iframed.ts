/**
 * Whether the current page is loaded in an iframe.
 */
export const isIframed = (): boolean => window.self !== window.top;
