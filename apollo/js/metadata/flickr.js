/*global d3, metadata */
"use strict";

// ---- metadata specification: flickr ----

metadata.flickr = function (spec) {
    var my = spec || { },
        that,
        from_string;

    // constructor: build from parent
    that = metadata(my);
    if (!Array.isArray(my.extra_fields)) {    // validate extra_fields
        my.extra_fields = [ ];
    }

    from_string = function (meta_s) {
        var s, headers;
        if (typeof meta_s !== 'string') {
            return;
        }

        // strip blank "rows" at start or end
        s = meta_s.replace(/^\n*/, "")
            .replace(/\n*$/, "\n");

        headers = 'title,mission,magazine,number,album_id,farm,id,originalsecret,secret,server,sizes'.split(',');

        // assume that there is no column header
        my.docs = d3.csv.parseRows(s, function (d, j) {
            var result;

            result = {};

            d.forEach(function (x, i) {
                result[headers[i]] = x.trim()
            });

            result.mission = parseInt(result.mission);
            result.magazine = parseInt(result.magazine);
            result.number = parseInt(result.number);

            return result;
        });
    };
    that.from_string = from_string;

    return that;
};
