/**
 * See the README.md-file in this folder for more information.
 */
// The value of this variable will be replaced at build-time with the proper environment-value.
window.API_URL = `NG_URL_121_SERVICE_API`;

function redirectToLogin() {
  window.location.assign('/login?forced=' + Date.now());
}

window.setTimeout(async () => {
  window.localStorage.clear();
  window.sessionStorage.clear();

  await window
    .fetch(`${window.API_URL}/users/logout`, {
      credentials: 'include',
      method: 'POST',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-121-Interface': 'portal', // See: services/121-service/src/shared/enum/interface-names.enum.ts
      },
    })
    .finally(() => {
      redirectToLogin();
    });
}, 16);
