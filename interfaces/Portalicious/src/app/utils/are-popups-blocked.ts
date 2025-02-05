/**
 * Checks if the browser is blocking (automatically opened) pop-up windows.
 *
 * This function attempts to open a small pop-up window. If the window cannot be opened,
 * it means that automatic pop-ups are blocked by the browser.
 *
 * This method SHOULD NOT be called via a user-initiated event (e.g. button click) as it will give a false-negative result.
 * To see if pop-ups can be opened by a script, it should be tested by a script.
 *
 * @returns {boolean} - Returns true if pop-ups are blocked, otherwise false.
 */
export const areAutomatedPopupsBlocked = (): boolean => {
  const testPopup = window.open(
    'about:blank',
    '_blank',
    'width=100,height=100',
  );

  if (
    !testPopup ||
    testPopup.closed ||
    typeof testPopup.closed === 'undefined'
  ) {
    console.info(`Automated popups are blocked by the users' browser.`);
    return true; // Popup is blocked
  } else {
    testPopup.close();
    console.info(`Automated popups are allowed by the users' browser.`);
    return false; // Popup is not blocked
  }
};
