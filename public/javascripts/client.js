$(function() {

  /**
   * Controller/View
   */
  var NAMESPACES = {
    HOME: '/home'
  };
  var socket = io.connect('//' + location.host + NAMESPACES.HOME);
  var EVENTS = {
    TRK_DATA: 'trkData'
  };
  socket.on(EVENTS.TRK_DATA, function(trkData) {
    console.log(trkData);
  });
  socket.on('connect', function() {
    $('.progress').hide();
  });
  socket.on('disconnect', function() {
    $('.progress').show();
    $('#no-results').hide();
  });

  /**
   * Filters
   */
  $('#filters a').tooltip({
    placement: 'bottom'
  });

  /**
   * detect flash and zeroclipboard
   */
  if (ZeroClipboard) {
    //http://stackoverflow.com/questions/998245/how-can-i-detect-if-flash-is-installed-and-if-not-display-a-hidden-div-that-inf/
    var hasFlash = false;
    try {
      if ((navigator.mimeTypes && navigator.mimeTypes['application/x-shockwave-flash']) ? navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin: 0) {
        hasFlash = true;
      }
    } catch(e) {
      if (navigator.mimeTypes['application/x-shockwave-flash'] !== undefined) {
        hasFlash = true;
      }
    }
    if (hasFlash) {
      //if (typeof swfobject !== 'undefined' && swfobject.getFlashPlayerVersion().major >= 10) {
      new ZeroClipboard($('.btn-cp').show());
    }
  }
});

