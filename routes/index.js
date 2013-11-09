/**
 * GET home page.
 */

exports.index = function(req, res) {
  res.render('index', {
    title: 'Node KO Analytics',
    description: 'Node KO Analytics is a real time analytics dashboard for Node Knockout 2013.',
    author: 'kazuyukitanimura',
    domain: req.headers.host || 'localhost:3000'
  });
};

