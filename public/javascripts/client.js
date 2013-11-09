(function() {
  /**
   * Extend SmoothieChart
   */
  SmoothieChart.prototype.addTS = function(timeSeries) {
    this.addTimeSeries(timeSeries, timeSeries.options);
  };

  /**
   * Extend TimeSeries
   */
  TimeSeries.prototype.appendNow = function(value) {
    this.append(new Date().getTime(), value);
  };
})();

$(function() {
  /**
   * Convenient Functions
   */
  var rand = function(max) { // does not include max
    return Math.floor(Math.random() * max);
  };
  var compByCount = function(a, b) {
    return b.count - a.count;
  };
  var hue = rand(360);
  var makeTS = function() {
    var options = {
      strokeStyle: ['hsl(', hue, ', 100%, 50%)'].join(''),
      fillStyle: ['hsla(', hue, ', 100%, 60%, 0.4)'].join(''),
      lineWidth: 3
    };
    hue = (hue + 139) % 360; // avoid similar colors, 139 is a prime number and close to golden angle
    var ts = new TimeSeries(options);
    ts.appendNow(0);
    return ts;
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
  var tooltipOptions = {
    placement: 'right'
  };
  var lastTrkData = [];
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
    var tl = Math.ceil(trkData.length / sl);
    var i;
    if (tl > 1) {
      for (i = 1; i <= sl; i++) {
        if (i <= tl) {
          $('#p' + i).show();
        } else {
          $('#p' + i).hide();
        }
      }
      $('#pagination').show();
    } else {
      $('#pagination').hide();
    }
    trkData = trkData.sort(currentComp);
    for (i = 0; i < sl;) {
      var trkDataPos = i + startPage * sl;
      var trkDatum = trkData[trkDataPos];
      var smoothie = smoothies[i];
      i += 1;
      if (trkDatum) {
        var host = trkDatum.host;
        var count = trkDatum.count;
        var title = trkDatum.title;
        var aveStay = trkDatum.aveStay;
        var line = hostTS[host];
        if (!line) {
          line = makeTS();
          hostTS[host] = line;
        }
        line.appendNow(count);
        smoothie.addTS(line);
        host = 'http://' + host;
        $('.link' + i).attr('href', host);
        $('#title' + i).text(trkDataPos + 1 + '. ' + title);
        $('#url' + i).text(host);
        $('#currentValue' + i + ' i').text(' ' + count);
        $('#aveStay' + i + ' i').text(' ' + (aveStay / 1000).toFixed() + ' sec.');
        $('#currentValue' + i).tooltip(tooltipOptions);
        $('#aveStay' + i).tooltip(tooltipOptions);
        if ($('#thumb' + i).attr('src') !== host) {
          $('#thumb' + i).attr('src', host);
        }
        $('#res' + i).show();
      } else {
        $('#res' + i).hide();
      }
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

