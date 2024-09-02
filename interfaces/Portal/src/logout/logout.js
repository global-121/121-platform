function deleteCookies() {
  var c = document.cookie.split(';');
  for (var i = 0; i < c.length; i++) {
    var e = c[i].indexOf('=');
    var n = e > -1 ? c[i].substr(0, e) : c[i];
    document.cookie = n + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

window.setTimeout(function () {
  window.localStorage.clear();
  window.sessionStorage.clear();
  deleteCookies();

  window.location.href = '/login?' + Math.random();
}, 1000);
