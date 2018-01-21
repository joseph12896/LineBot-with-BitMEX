const express = require('express'),
    router = express.Router(),
    path = require('path'),
    fs = require('fs'),
    File = require(SCHEMA_PATH).File,
    cache = require('../Cache'),
    crypto = require('crypto');

// GET home page. 
router.all('/', async function (req, res, next) {
    res.status(404).end();
})

// GET file
router.get('/:hash', async function (req, res, next) {
    try {
        let hash = req.params.hash,
            item;

        // look up cache
        if (item = cache.get(hash)) {
            // in cache
        } else if (item = await File.findOne({ hash }).exec()) {
            // in database but not in cache, put it into cache for further access
            cache.set(hash, item);
        }

        if (item) {
            // not undefined or null
            // return data
            return res.
                // set('Content-Length', item.data.length). // Express is smart enough to count content length 
                set("Content-Disposition", `attachment; filename="${item.filename}"`).
                type(item.filename).
                send(item.data);
        }

        // not exist
        res.status(404).end();
    } catch (e) {
        console.log(e)
    }
});
module.exports = router;
