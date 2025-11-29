/**
 * See the README.md-file in this folder for more information.
 */
// The value of this variable will be replaced at build-time with the proper environment-value.
const API_URL = `NG_URL_121_SERVICE_API`;

const redirectToLogin = () => {
  window.location.assign('/en-GB/login?' + Date.now());
};

window.setTimeout(async () => {
  window.localStorage.clear();
  window.sessionStorage.clear();

  await window
    .fetch(`${API_URL}/users/logout`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-121-interface': 'portal', // See: services/121-service/src/shared/enum/interface-names.enum.ts
      },
      method: 'POST',
      mode: 'cors',
    })
    .finally(() => {
      redirectToLogin();
    });
}, 16);
