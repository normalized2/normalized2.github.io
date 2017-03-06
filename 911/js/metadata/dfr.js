/*global d3, metadata */
"use strict";

// ---- metadata specification: DfR ----
//
// Metadata storage specialized for DfR. from_string() expects eight DfR
// metadata columns (trimmed as by dfrtopics::export_browser_data). For
// additional columns, names may be specified at construction time with
//
// metadata.dfr({ extra_fields: [ "genre", "sparkliness" ] })
//
// otherwise the default is to name them X1, X2, ...

metadata.dfr = function (spec) {
    var my = spec || { },
        that,
        from_string;

    // constructor: build from parent
    that = metadata(my);
    if (!Array.isArray(my.extra_fields)) {    // validate extra_fields
        my.extra_fields = [ ];
    }

    from_string = function (meta_s) {
        var s;
        if (typeof meta_s !== 'string') {
            return;
        }

        // strip blank "rows" at start or end
        s = meta_s.replace(/^\n*/, "")
            .replace(/\n*$/, "\n");

        // assume that there is no column header
        my.docs = d3.csv.parseRows(s, function (d, j) {
            var result, content, title;

            // assume these columns:
            // 0      1     2      3         4           5      6
            // mid, title, author, content, parant_id, img_ids, dts,
            // 7         8
            // childs, lemmas
            content = d[3].trim();
            content = content.replace(/\$/g, "\n");

            // used in topics doc list, images docs
            title = content.split(' ').slice(0, 20).join(' ');

            result = {
                doi: d[0].trim(), // id
                title: title,
                authors: d[2].trim(),
                content: content,
                parentId: d[4].trim(),
                img_ids: d[5].trim(),
                date: new Date(d[6].trim()), // pubdate (UTC)
                childs: d[7].trim(),
                lemmas: d[8].trim()
            };

            // now add extra columns
            d.slice(8, d.length).forEach(function (x, i) {
                result[my.extra_fields[i] || "X" + String(i)] = x.trim();
            });
            return result;
        });
    };
    that.from_string = from_string;

    return that;
};
