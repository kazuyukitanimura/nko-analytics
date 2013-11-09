/**
 * HostData Class
 *
 * @param {Object} options or {String} host
 */
var HostData = module.exports = function(options) {
  if (! (this instanceof HostData)) { // enforcing new
    return new HostData(options);
  }
  var host;
  if (typeof options === 'string') {
    host = options;
    options = {};
  } else {
    host = options.host;
  }
  this.host = host;
  this.count = options.count || 0;
  this._titles = options._titles || {}; // key: uid, val: title
  this._titleCount = options._titleCount || {}; // key: title, val: count
  this.title = options.title || host || 'Title Unknown';
  this._sinces = options._sinces || {}; // key: uid, val: millisecond
  this.aveStay = options.aveStay || 0;
  this._aveStayCount = options._aveStayCount || 0;
  this._lastUpdate = options._lastUpdate || Date.now();
};

HostData.prototype._updateTitle = function() {
  var maxCount = 0;
  for (var k in this._titleCount) {
    if (this._titleCount.hasOwnProperty(k)) {
      var count = this._titleCount[k];
      if (maxCount < count) {
        maxCount = count;
        this.title = k;
      }
    }
  }
  this._lastUpdate = Date.now();
};

/**
 * add one access
 *
 * @param {String} uid
 * @param {String} title
 * @param {Number} since
 */
HostData.prototype.add = function(uid, title, since) {
  this.count += 1;
  if (title) {
    title = decodeURIComponent(title).trim();
    this._titles[uid] = title;
    this._titleCount[title] = (this._titleCount[title] || 0) + 1;
  }
  this._updateTitle();
  this._sinces[uid] = since;
};

/**
 * delete one access
 *
 * @param {String} uid
 */
HostData.prototype.del = function(uid) {
  this.count -= 1;
  if (this.count < 0) {
    console.error('ERROR: count became negative!! uid:', uid);
  }
  var title = this._titles[uid];
  this._titles[uid] = undefined;
  this._titleCount[title] = (this._titleCount[title] || 1) - 1;
  if (!this._titleCount[title]) {
    this._titleCount[title] = undefined;
  }
  this._updateTitle();
  var since = this._sinces[uid];
  this._sinces[uid] = undefined;
  var stayed = Date.now() - since;
  this.aveStay *= this._aveStayCount / ++this._aveStayCount;
  this.aveStay += stayed / this._aveStayCount;
};

/**
 * return public properties
 */
HostData.prototype.getPublic = function() {
  var res = {};
  for (var k in this) {
    if (this.hasOwnProperty(k) && k.indexOf('_') !== 0) {
      res[k] = this[k];
    }
  }
  return res;
};

