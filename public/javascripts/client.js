(function() {
  /**
   * Extend SmoothieChart
   */
  SmoothieChart.prototype.addTS = function(timeSeries) {
    this.addTimeSeries(timeSeries, timeSeries.options);
  };
  SmoothieChart.prototype.rmAllTS = function(timeSeries) {
    var seriesSet = this.seriesSet;
    for (var i = seriesSet.length; i--;) {
      clearInterval(seriesSet[i].resetBoundsTimerId);
    }
    this.seriesSet = [];
  };

  /**
   * Extend TimeSeries
   */
  TimeSeries.prototype.appendNow = function(value) {
    this.append(new Date().getTime(), value);
  };
  TimeSeries.prototype.appendKeep = function(value, delay) {
    if (!delay) {
      delay = 1000;
    }
    this.appendNow(value);
    clearInterval(this.refresher);
    var self = this;
    this.refresher = setInterval(function() {
      self.appendNow(value);
    },
    delay);
  };
})();

$(function() {
  /**
   * Convenient Functions
   */
  var rand = function(max) { // does not include max
    return Math.floor(Math.random() * max);
  };
  var compByAveStay = function(a, b) {
    return b.aveStay - a.aveStay;
  };
  var compByCount = function(a, b) {
    var res = b.count - a.count;
    if (!res && compByAveStay) { // tie
      return compByAveStay(a, b);
    }
    return b.count - a.count;
  };
  var compByTitle = function(a, b) {
    return a.title > b.title ? 1: - 1;
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
    for (i = sl; i--;) {
      smoothies[i].rmAllTS();
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
        line.appendKeep(count, delay);
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
  $('#searchFilter').keyup(function(e) {
    location.hash = encodeURIComponent(JSON.stringify({
      search: $(this).val()
    }));
  });

  /**
   * Hash change
   */
  var compFuncs = { // key: hash url, val: comp func
    'count': compByCount,
    'avestay': compByAveStay,
    'title': compByTitle
  };
  var hash;
  var hashObj = {};
  var onHashChange = function() {
    // Firefox automatically decode location.hash, so use location.href :(
    // http://stackoverflow.com/questions/4835784/firefox-automatically-decoding-encoded-parameter-in-url-does-not-happen-in-ie/4835922
    var nextHash = location.href.split('#')[1]; //location.hash.slice(1);
    if (nextHash !== hash) {
      try {
        var nextHashObj = JSON.parse(decodeURIComponent(nextHash));
        var nextSort = nextHashObj.sort;
        var nextComp = compFuncs[nextSort];
        if (nextComp) {
          currentComp = nextComp;
          $('#filters a').removeClass('btn-success');
          $('#filters a#f' + nextSort).addClass('btn-success');
        }
        hash = encodeURIComponent(JSON.stringify($.extend(hashObj, nextHashObj)));
        if (nextComp) {
          if (lastTrkData.length) {
            onTrkData(lastTrkData);
          }
          window.scrollTo(0, 0); // scroll to top
        }
        location.hash = hash;
      } catch(err) {
        console.warn(err);
      }
    }
  };
  onHashChange();
  $(window).on('hashchange', onHashChange);

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

