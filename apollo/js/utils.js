/*global jQuery */

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
    'm': 'Medium 500 (500 x 497)',
    'z': 'Medium 640 (640 x 636)',
    'c': 'Medium 800 (800 x 795)',
    'l': 'Large 1024 (1024 x 1018)',
    'h': 'Large 1600 (1600 x 1590)',
    'k': 'Large 2048 (2048 x 2036)',
    'o': 'Original (4175 x 4150)',
    };


    that.availables_sizes = availables_sizes;

    var get_flickr_url = function (row, size) {
        var url_templ, res;

        if (!size) {
            url_templ = "https://www.flickr.com/photos/projectapolloarchive/{id}/in/album-{album_id}/"
        } else if (size == 'o') {
            url_templ = "https://c1.staticflickr.com/1/{server}/{id}_{originalsecret}_{size}.jpg"
        } else {
            url_templ = "https://c1.staticflickr.com/1/{server}/{id}_{secret}_{size}.jpg";
        }

        res = url_templ;
        res = res.split('{album_id}').join(row.album_id);
        res = res.split('{server}').join(row.server);
        res = res.split('{secret}').join(row.secret);
        res = res.split('{id}').join(row.id);
        res = res.split('{size}').join(size);

        return res;
    };

    that.get_flickr_url = get_flickr_url;

    var format = function(t, row) {
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

        return t;
    }
    that.format = format;

    return that;
}());
