'use strict';

module.exports = {
  minify: {},
  runInProd: false, // the idea is the dev will commit the minified version anyway so no need in prod

  // for npm minify
  opts: {
    js: {},
    css: {},
    html: {},
    img: {},
  },
}