/**
 * swap back global variables, see pre-trk.js
 */
(function() {
  var backups = NKO_TRK.backups;
  for (var k in backups) {
    if (backups.hasOwnProperty(k)) {
      window[k] = backups[k];
    }
  }
  NKO_TRK.backups = undefined;
})();

