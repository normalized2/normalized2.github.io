/*global jQuery, VIS */

var utils = (function () {
    "use strict";
    var that = {},
        shorten,
        deep_replace,
        clone,
        MAX_CLONE_DEPTH = 10, // "constant"
        asc,
        desc,
        bisector_left;

    // shorten a sorted array to n elements, allowing more than n elements if
    // there are ties at the end
    // xs: array to shorten
    // n: desired length (result is shorter if xs is shorter, longer if there
    //    are ties at the end of xs
    // f: subscripting function: f(xs, i) = xs[i] by default
    shorten = function (xs, n, f) {
        var i, accessor = f;

        if (xs.length <= n) {
            return xs;
        }
        if (typeof f !== 'function') {
            accessor = function (a, i) { return a[i]; };
        }

        for (i = n; i < xs.length; i += 1) {
            if (accessor(xs, i) !== accessor(xs, n - 1)) {
                break;
            }
        }
        return xs.slice(0, i);
    };
    that.shorten = shorten;


    // replace the non-method properties of one object with those of
    // another without overwriting any properties in the original not
    // specified in the replacement
    //
    // x: the original
    // repl: the source of replacements

    deep_replace = function (x, repl) {
        var prop, result = x;
        if (repl === undefined) {
            return x;
        }

        if (x === undefined) {
            return repl;
        }

        // we get errors if we treat arrays like ordinary objects
        if (Array.isArray(x) || Array.isArray(repl)) {
            return repl;
        }

        if (typeof repl === "object") {
            if (typeof x !== "object") {
                result = { };
            }
            for (prop in repl) {
                if (repl.hasOwnProperty(prop)
                        && typeof repl[prop] !== 'function') {
                    result[prop] = deep_replace(x[prop], repl[prop]);
                }
            }
        } else if (typeof repl !== 'function') {
            result = repl;
        }
        return result;
    };
    that.deep_replace = deep_replace;

    // clone an object's data properties (strings, numbers, and booleans),
    // descending rescursively into arrays or objects. Anything else (e.g.
    // functions) is not cloned but simply returned. The maximum recursion
    // depth is MAX_CLONE_DEPTH to prevent infinite recursion if at some
    // depth an object holds a reference to itself.
    clone = function (X) {
        var cloner;
        cloner = function (x, depth) {
            var prop, result;

            if (typeof x === "string" || typeof x === "number"
                    || typeof x === "boolean") {
                return x;
            }

            if (depth > MAX_CLONE_DEPTH) {
                return undefined;
            }

            if (Array.isArray(x)) {
                return x.map(function (y) {
                    return cloner(y, depth + 1);
                });
            }

            if (typeof x === "object") {
                result = { };
                for (prop in x) {
                    if (x.hasOwnProperty(prop)) {
                        result[prop] = cloner(x[prop], depth + 1);
                    }
                }
                return result;
            }
            // otherwise
            return x;
        };
        return cloner(X, 0);
    };
    that.clone = clone;

    // These three functions are lifted straight from the d3 code so
    // that we can invoke them in a Worker that doesn't have a document
    // context, which d3 requires.
    //
    // For the code by Mike Bostock, see:
    // https://github.com/mbostock/d3/blob/master/src/arrays

    asc = function asc(a, b) {
        return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    };
    that.asc = asc;

    desc = function(a, b) {
        return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
    };
    that.desc = desc;

    bisector_left = function (f) {
        var compare = (typeof f === "function") ?
            function(d, x) { return asc(f(d), x); }
            : asc;

        return function(a, x, lo, hi) {
            var mid;
            if (arguments.length < 3) {
                lo = 0;
            }
            if (arguments.length < 4) {
                hi = a.length;
            }
            while (lo < hi) {
                mid = lo + hi >>> 1;
                if (compare(a[mid], x) < 0) {
                    lo = mid + 1;
                } else {
                    hi = mid;
                }
            }
            return lo;
        };
    };
    that.bisector_left = bisector_left;

    that.bisect_left = that.bisector_left();

    function sortNumber(a, b) {
        return a - b;
    }

    that.sortNumbers = function(arr) {
        return arr.sort(sortNumber);
    };

    var parseParams = function(sQuery) {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) {
                return decodeURIComponent(s.replace(pl, " "));
                },
            params = {};

        if (sQuery === undefined) {return params;}

        while ((match = search.exec(sQuery)) !== null) {
            params[decode(match[1])] = decode(match[2]);
           }
        return params;
    };
    that.parseParams = parseParams;

    var parsedParams2query = function(searchParams) {
        var s = '',
            keys,
            kv = [];

        if (jQuery.isEmptyObject(searchParams)) {
            return s;
        } else {
            keys = Object.keys(searchParams);
            keys.forEach(function(key, i, keys) {
                if (key !== undefined) {
                    kv.push(key + '=' + searchParams[key]);
                    }
                });
            s = kv.join('&');
        }
        return s;
    };
    that.parsedParams2query = parsedParams2query;

    // check if some words in array `a` contains in array `b`
    var isIntersected = function (a, b) {
        return b.some(function (v) {
            return a.indexOf(v) >= 0;
        });
    };
    that.isIntersected = isIntersected;

    // check if all words in array `a` contains in array `b`
    // that is  each member in `a` must be present in 'b'
    var isSuperset = function (a, b) {
         return a.every(function (v) {
            return b.indexOf(v) >= 0;
         });
    };
    that.isSuperset = isSuperset;

    var availables_sizes = {
    undefined: 'link on page',
    'sq': 'Square 75 (75 x 75)',
    'q': 'Square 150 (150 x 150)',
    't': 'Thumbnail (100 x 99)',
    's': 'Small 240 (240 x 239)',
    'n': 'Small 320 (320 x 318)',
    'm/': 'Medium 500 (500 x 497)',
    'z': 'Medium 640 (640 x 636)',
    'c': 'Medium 800 (800 x 795)',
    'l/b': 'Large 1024 (1024 x 1018)',
    'h': 'Large 1600 (1600 x 1590)',
    'k': 'Large 2048 (2048 x 2036)',
    'o': 'Original (4175 x 4150)',
    };


    that.availables_sizes = availables_sizes;

    var get_flickr_url = function (row, size, sizes_table) {

        var url_templ, res;

        if (!size) {
            url_templ = "https://www.flickr.com/photos/projectapolloarchive/{id}/in/album-{album_id}/";
            return utils.format(url_templ, row);
        }


        if (!sizes_table) {
            // TODO:  utils --> this
            sizes_table = utils.get_flickr_sizes_table(row);
        }

        var row_size = sizes_table.filter(function (r) {return r.chars == size});

        if (row_size.length == 0)
            {
            console.log("get_flickr_url: not found size: " + size)
            return '';
            }
        row_size = row_size[0]

        if (row_size.secret == '')  {
            row_size.secret = row.secret;
        }
        row_size.size = row_size.l;
        if (row_size.size == '') {
            row_size.size = 'm';
        }
        row_size.server = row.server;
        row_size.farm = row.farm;
        row_size.id = row.id;

        url_templ = "https://farm{farm}.staticflickr.com/{server}/{id}_{secret}_{size}.jpg";
        // Another variant "https://c1.staticflickr.com/{farm}/{server}/{id}_{secret}_{size}.jpg"

        return utils.format(url_templ, row_size);
    };
    that.get_flickr_url = get_flickr_url;

    var get_flickr_sizes_table = function (row) {
        // row.sizes : 'label.width.height.chars.l.secret;label.width.height.chars.l.secret'
        var rows = row.sizes.split(';')
        
        return rows.map(function(item) {
            var a = item.split('.')
            return {
                'label': a[0],
                'width': a[1],
                'height': a[2],
                'chars': a[3],
                'l': a[4],
                'secret': a[5],
            };
        });

        /* return [{"l": "s", "chars": "sq", "height": 75, "width": 75, "label": "Square", "secret": ""}, {"l": "t", "chars": "t", "height": 100, "width": 96, "label": "Thumbnail", "secret": ""}, {"l": "q", "chars": "q", "height": 150, "width": 150, "label": "Large Square", "secret": ""}, {"l": "m", "chars": "s", "height": 240, "width": 229, "label": "Small", "secret": ""}, {"l": "n", "chars": "n", "height": 320, "width": 306, "label": "Small 320", "secret": ""}, {"l": "", "chars": "m", "height": 500, "width": 478, "label": "Medium", "secret": ""}, {"l": "z", "chars": "z", "height": 640, "width": 612, "label": "Medium 640", "secret": ""}, {"l": "c", "chars": "c", "height": 800, "width": 765, "label": "Medium 800", "secret": ""}, {"l": "b", "chars": "l", "height": 1024, "width": 979, "label": "Large", "secret": ""}, {"l": "h", "chars": "h", "height": 1600, "width": 1530, "label": "Large 1600", "secret": "b9ef0a0666"}, {"l": "k", "chars": "k", "height": 2048, "width": 1959, "label": "Large 2048", "secret": "9ca195915e"}, {"l": "o", "chars": "o", "height": 4600, "width": 4400, "label": "Original", "secret": "19970ddae6"}]; */
    }
    that.get_flickr_sizes_table = get_flickr_sizes_table;

    var get_little_img_url = function(row_common, my) {

        var df_flickr, rows, row, number, res ='';
        if (row_common.flickr == 1) {
            df_flickr = my.m.meta_flickr(undefined);

            rows = df_flickr.filter(function(r) { return r.number  == row_common.number;});
            if (rows.length != 0) {
                row = rows[0];
                res = utils.get_flickr_url(row, 'q');
            }
        } else if (row_common.lpi == 1) {
            var t = 'https://www.lpi.usra.edu/resources/apollo/images/browse/AS{mission}/{magazine}/{number}.jpg';
            var dict = {
                mission: utils.fill_left(row_common.mission, 2),
                magazine: utils.fill_left(row_common.magazine, 2),
                number: utils.fill_left(row_common.number, 3),
            }
            res = utils.format(t, dict);
        }
        return res;
    }
    that.get_little_img_url = get_little_img_url;

    var get_big_img_url = function(row_common, my) {

        var df_flickr, rows, row, number, res ='';
        if (row_common.flickr == 1) {
            df_flickr = my.m.meta_flickr(undefined);

            rows = df_flickr.filter(function(r) { return r.number  == row_common.number;});
            if (rows.length != 0) {
                row = rows[0];
                res = utils.get_flickr_url(row, VIS.flickr_big_size);
            }
        } else if (row_common.lpi == 1) {
            var t = 'https://www.lpi.usra.edu/resources/apollo/images/browse/AS{mission}/{magazine}/{number}.jpg';
            // TODO: use row_common.lpi_full flag

            var df_lpi = my.m.meta_lpi(undefined);
            rows = df_lpi.filter(function(r) { return r.number  == row_common.number;});
            if (rows.length != 0) {
                row = rows[0];
                if (row['Hi Resolution Image(s)']) {
                    t = 'https://www.lpi.usra.edu/resources/apollo/images/print/AS{mission}/{magazine}/{number}.jpg';
                }
            }
            var dict = {
                mission: utils.fill_left(row_common.mission, 2),
                magazine: utils.fill_left(row_common.magazine, 2),
                number: utils.fill_left(row_common.number, 3),
            }
            res = utils.format(t, dict);
        }
        return res;
    }
    that.get_big_img_url = get_big_img_url;


    var get_tag_list = function(row_common, my) {
        var res = [];
        // for image title in search result,  tags list
        if (row_common.lpi == 1) {
            var df_lpi, rows, row, number;

            df_lpi = my.m.meta_lpi(undefined);
            rows = df_lpi.filter(function(r) { return r.number  == row_common.number;});
            if (rows.length != 0) {
                row = rows[0];
                var names = 'Description,Feature(s)'.split(",");
                var taglist = [];
                for (var k in names) {
                    var key = names[k];
                    if (row[key]) {
                        var ba = row[key].split(/,|;/);
                        taglist = taglist.concat(ba);
                    }
                }
                res = taglist;
            }
        }
        return res;
    }
    that.get_tag_list = get_tag_list;

    var format = function(t, row) {
        // TODO:  use Object.keys()
        t = t.split('{mission}').join(row.mission);
        t = t.split('{magazine}').join(row.magazine);
        t = t.split('{number}').join(row.number);
        if (row.time) {
            t = t.split('{time}').join(row.time);
        }
        if (row.id) {
            t = t.split('{id}').join(row.id);
        }
        if (row.album_id) {
            t = t.split('{album_id}').join(row.album_id);
        }
        if (row.server) {
            t = t.split('{server}').join(row.server);
        }
        if (row.secret) {
            t = t.split('{secret}').join(row.secret);
        }
        if (row.id) {
            t = t.split('{id}').join(row.id);
        }
        if (row.size) {
            t = t.split('{size}').join(row.size);
        }
        if (row.originalsecret) {
            t = t.split('{originalsecret}').join(row.originalsecret);
        }
        if (row.farm) {
            t = t.split('{farm}').join(row.farm);
        }
        if (row.spaceflight_page) {
            t = t.split('{spaceflight_page}').join(row.spaceflight_page);
        }
        return t;
    }
    that.format = format;

    var fill_left = function paddy(num, padlen, padchar) {
        if ((num + '').length >= padlen)  {
            return num;
        }
        var pad_char = typeof padchar !== 'undefined' ? padchar : '0';
        var pad = new Array(1 + padlen).join(pad_char);
        return (pad + num).slice(-pad.length);
    }
    that.fill_left = fill_left 

    return that;
}());
