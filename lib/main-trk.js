(function () {
  /**
   * Settings
   */
  //var host = 'http://localhost:3000';
  var host = 'http://nko-analytics.2013.nodeknockout.com';

  /**
   * utils
   */
  var queryStringify = function(obj) {
    var components = [];
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        components.push(k + '=' + encodeURIComponent(obj[k]));
      }
    }
    return components.join('&');
  };

  /**
   * tracking
   */
  var data = {
    href: location.href,
    title: document.title
  };
  var options = {
    query: queryStringify(data)
  };
  var socket = io.connect(host, options);

  /**
   * ribbon
   *
   * @param {Boolean} bottom
   * @param {Boolean} left
   */
  var getRibbon = function(bottom, left, side) {
    // http://www.kirilv.com/fork-ribbon-css-builder/
    var color = '#444';
    var bgColor = '#F6C304';
    var deg = 45 + (bottom !== left? 270: 0); // if topLeft or bottomRight then 45 + 270
    deg += side? 135 * (left? 1: -1) :  0;
    var rotate = ['rotate(', deg, 'deg)'].join('');
    var ribbon = document.createElement('a');
    ribbon.setAttribute('href', host);
    ribbon.setAttribute('target', '_blank');
    ribbon.innerHTML                      = 'Node KO Analytics';
    ribbon.style.position                 = 'fixed';
    ribbon.style.padding                  = '5px 45px';
    ribbon.style.minWidth                 = '123px';
    ribbon.style.backgroundColor          = bgColor;
    ribbon.style.color                    = color;
    ribbon.style.fontSize                 = '13px';
    ribbon.style.lineHeight               = 'normal';
    ribbon.style.fontFamily               = 'sans-serif';
    ribbon.style.textDecoration           = 'none';
    ribbon.style.fontWeight               = 'bold';
    ribbon.style.msBackfaceVisibility     = 'hidden';
    ribbon.style.mozBackfaceVisibility    = 'hidden';
    ribbon.style.webkitBackfaceVisibility = 'hidden';
    ribbon.style.backfaceVisibility       = 'hidden';
    ribbon.style.border                   = '2px dotted ' + color;
    ribbon.style.boxShadow                = '0 0 0 3px ' + bgColor;
    ribbon.style.textShadow               = '0 0 0 ' + color;
    ribbon.style[bottom? 'bottom': 'top'] = '50' + (side? '%': 'px');
    ribbon.style[left? 'left': 'right']   = (side? -96: -50) + 'px';
    ribbon.style.msTransform              = rotate;
    ribbon.style.mozTransform             = rotate;
    ribbon.style.webkitTransform          = rotate;
    ribbon.style.transform                = rotate;
    ribbon.style.zIndex                   = 2147483647; // max z-index
    return ribbon;
  };

  io.util.defer(function(){
    var ribbons = [];
    var noRibbon    = document.querySelectorAll('script.trk-no-ribbon');
    var topRight    = document.querySelectorAll('script.trk-ribbon-top-right');
    var topLeft     = document.querySelectorAll('script.trk-ribbon-top-left');
    var bottomRight = document.querySelectorAll('script.trk-ribbon-bottom-right');
    var bottomLeft  = document.querySelectorAll('script.trk-ribbon-bottom-left');
    var sideRight   = document.querySelectorAll('script.trk-ribbon-side-right');
    var sideLeft    = document.querySelectorAll('script.trk-ribbon-side-left');
    if (topRight && topRight.length) {
      ribbons.push(getRibbon(false, false, false));
    }
    if (topLeft && topLeft.length) {
      ribbons.push(getRibbon(false, true, false));
    }
    if (bottomRight && bottomRight.length) {
      ribbons.push(getRibbon(true, false, false));
    }
    if (bottomLeft && bottomLeft.length) {
      ribbons.push(getRibbon(true, true, false));
    }
    if (sideRight && sideRight.length) {
      ribbons.push(getRibbon(false, false, true));
    }
    if (sideLeft && sideLeft.length) {
      ribbons.push(getRibbon(false, true, true));
    }
    if (noRibbon && noRibbon.length) {
      ribbons = [];
    } else if (!ribbons.length) { // add one by default
      ribbons.push(getRibbon());
    }
    for (var i = ribbons.length; i--;) {
      document.getElementsByTagName('body')[0].appendChild(ribbons[i]);
    }
  });
})();
