/**
 * globals
 */
window.NKO_TRK = {};
window.NKO_TRK.backups = {};

/**
 * swap global variables and swap back later in post-trk.js
 */
(function() {
  var wraps = ['io'];
  for (var i = wraps.length; i--;) {
    var wrap = wraps[i];
    if (window[wrap]) {
      NKO_TRK.backups[wrap] = window[wrap];
    }
  }
})();

