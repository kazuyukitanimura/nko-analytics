(function () {
  /**
   * Settings
   */
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

})();
