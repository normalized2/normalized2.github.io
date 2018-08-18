/*global d3, metadata */
"use strict";

// ---- metadata specification: lpi ----

metadata.lpi = function (spec) {
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

        headers = 'title,mission,magazine,magazine_letter,number,Camera Altitude,Camera Azimuth,Camera Tilt,Description,Feature(s),Film Color,Film Type,Film Width,Hi Resolution Image(s),Image Collection,Index Map,Latitude / Longitude,Lens Focal Length,Magazine,Magazine Letter,Mission,Mission Activity,Notes,Quality,Revolution,Sun Elevation,doc_url,doc_url_full'.split(',');


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
