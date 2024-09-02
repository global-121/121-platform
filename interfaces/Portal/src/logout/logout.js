window.setTimeout(function () {
  window.localStorage.clear();
  window.sessionStorage.clear();

  window.location.href = '/login?forced=' + Date.now();
}, 1000);
