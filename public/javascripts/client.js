$(function() {
  /**
   * Convenient Functions
   */
  var compByCount = function(a, b) {
    return b.count - a.count;
  };
  //var yMax = 1;
  var makeSC = function() {
    var chartFormat = {
      timestampFormatter: SmoothieChart.timeFormatter,
      //maxValueScale: 1.2,
      minValue: 0,
      labels: {
        precision: 0
      },
      grid: {
        verticalSections: 4
        //},
        //yRangeFunction: function(range) {
        //  if (yMax < range.max) {
        //    yMax = range.max;
        //  }
        //  return {
        //    min: range.min,
        //    max: yMax + 1
        //  };
      }
    };
    return new SmoothieChart(chartFormat);
  };

  /**
   * Controller/View
   */
  var delay = 1000;
  var smoothies = [];
  var canvases = $(".chartCanvas").tooltip();
  for (var i = 0, l = canvases.length; i < l; i++) {
    var smoothie = makeSC();
    smoothie.streamTo(canvases[i], delay);
    smoothies.push(smoothie);
  }
  var currentComp = compByCount;
  var hostTS = {};
  var NAMESPACES = {
    HOME: '/home'
  };
  var socket = io.connect('//' + location.host + NAMESPACES.HOME);
  var EVENTS = {
    TRK_DATA: 'trkData'
  };
  var startPage = 0; // start from 0
  var currentSearch; //TODO
  var onTrkData = function(trkData) {
    lastTrkData = trkData;
    if (currentSearch) {
      trkData = $.grep(trkData, function(trkDatum) {
        return (trkDatum.host || "").toLowerCase().indexOf(currentSearch) >= 0 || (trkDatum.title || "").toLowerCase().indexOf(currentSearch) >= 0;
      });
    }
    var sl = smoothies.length;
    var i = 0;
    trkData = trkData.sort(currentComp);
    var trkDataPos = i + startPage * sl;
    var trkDatum = trkData[trkDataPos];
    var smoothie = smoothies[i];
    i += 1;
    if (trkDatum) {
      $('#res' + i).show();
    } else {
      $('#res' + i).hide();
    }
    if (!trkData.length) {
      $('#no-results').show();
    } else {
      $('#no-results').hide();
    }
  };
  socket.on(EVENTS.TRK_DATA, onTrkData);
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

