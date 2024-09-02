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
      contentType: 'application/json',
    })
    .finally(() => {
      redirectToLogin();
    });
}, 1_000);
