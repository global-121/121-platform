/**
 * Checks if the browser is blocking pop-up windows.
 *
 * This function attempts to open a small pop-up window. If the window cannot be opened,
 * it means that pop-ups are blocked by the browser.
 *
 * @returns {boolean} - Returns true if pop-ups are blocked, otherwise false.
 */
export function isPopupBlocked(): boolean {
  const testPopup = window.open('', '_blank', 'width=100,height=100');
  if (
    !testPopup ||
    testPopup.closed ||
    typeof testPopup.closed === 'undefined'
  ) {
    return true; // Popup is blocked
  } else {
    testPopup.close();
    return false; // Popup is not blocked
  }
}
