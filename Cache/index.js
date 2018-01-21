/**
 * Cache
 */
var LRU = require("lru-cache")
    , options = {
        max: 1024 * 1024 * 50 // 50MB
        , length: function (n, key) {
            return n.data.length; // buffer size
        }
        , dispose: function (key, n) {
            // n.close()
        }
        , maxAge: 1000 * 60 * 60 * 24 // 24hr
    }
    , cache = LRU(options),
    path = require('path');

module.exports = cache;