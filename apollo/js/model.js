/*global d3, utils, bib, Worker */
"use strict";
var model;

// model specification
// -------------------
// data stored internally as follows:
// tw: array of d3.map()s keyed to words as strings
// alpha: alpha values for topics
// meta: object holding document citations

model = function (spec) {
    var my = spec || { }, // private members
        that = { }, // resultant object
        info, // accessors and pseudo-accessors
        n_docs,
        n_images,
        has_dt,
        tw,
        ta,
        ti,
        n,
        n_top_words,
        n_top_authors,
        n_top_images,
        total_tokens,
        topic_total,
        alpha,
        meta,
        meta_alsj,
        meta_flickr,
        meta_lpi,
        meta_common,
        meta_magazines,
        meta_condition,
        vocab,
        topic_scaled,
        topic_conditional, // slicing by metadata variable
        conditional_total,
        topic_docs, // most salient _ in _
        topic_docs_conditional,
        topic_words,
        topic_authors,
        topic_images,
        doc_topics,
        word_topics,
        topic_label,
        set_dt, // methods for loading model data from strings
        set_tw,
        set_meta,
        set_meta_alsj,
        set_meta_flickr,
        set_meta_lpi,
        set_meta_common,
        set_meta_magazines,
        doc_category,
        set_topic_scaled;

    my.ready = { };
    //my.worker = new Worker("js/worker.min.js");
    my.worker = new Worker("js/worker.js");
    my.worker.fs = d3.map();
    my.worker.onmessage = function (e) {
        var f = my.worker.fs.get(e.data.what);
        if (f) {
            f(e.data.result);
        }
    };
    my.worker.callback = function (key, f) {
        my.worker.fs.set(key, f);
    };

    info = function (model_meta) {
        if (model_meta) {
            my.info = model_meta;
        }
        return my.info;
    };
    that.info = info;

    n_docs = function () {
        var result;
        if (my.n_docs !== undefined) {
            result = my.n_docs;
        } else if (my.meta) {
            result = my.meta.n_docs();
        }

        return result; // undefined if my.meta is missing
    };
    that.n_docs = n_docs;

    n_images = function () {
        var result;
        if (my.n_images !== undefined) {
            result = my.n_images;
        } else if (my.meta_images) {
            result = my.meta_images.n_docs();
        }
        return result; // undefined if my.meta is missing
    };
    that.n_images = n_images;

    // has dt been loaded?
    has_dt = function () {
        return !!my.ready.dt;
    };
    that.has_dt = has_dt;

    // access top key words per topic
    tw = function (t, word) {
        if (!my.tw) {
            return undefined;
        }

        // tw() for the whole list of hashes
        if (t === undefined) {
            return my.tw;
        }

        // tw(t) for a particular topic
        if (word === undefined) {
            return my.tw[t];
        }

        // tw(t, word) for the weight of word in topic t
        return my.tw[t].get(word);
    };
    that.tw = tw;

    // access top key authors per topic
    ta = function (t, author) {
        if (!my.ta) {
            return undefined;
        }

        // ta() for the whole list of hashes
        if (t === undefined) {
            return my.ta;
        }

        // tw(t) for a particular topic
        if (author === undefined) {
            return my.ta[t];
        }

        // tw(t, word) for the weight of word in topic t
        return my.ta[t].get(author);
    };
    that.ta = ta;


    // access top key images per topic
    ti = function (t, image) {
        if (!my.ti) {
            return undefined;
        }

        // ti() for the whole list of hashes
        if (t === undefined) {
            return my.ti;
        }

        // tw(t) for a particular topic
        if (image === undefined) {
            return my.ti[t];
        }

        // tw(t, word) for the weight of word in topic t
        return my.ti[t].get(image);
    };
    that.ti = ti;


    // number of topics
    n = function () {
        return my.n;
    };
    that.n = n;

    // number of top words per topic stored in tw
    n_top_words = function () {
        if (!this.tw()) {
            return undefined;
        }

        return my.tw[0].keys().length;
    };
    that.n_top_words = n_top_words;

    // number of top authors per topic stored in tw
    n_top_authors = function () {
        if (!this.ta()) {
            return undefined;
        }

        return my.ta[0].keys().length;
    };
    that.n_top_authors = n_top_authors;

    // number of top images per topic stored in tw
    n_top_images = function () {
        if (!this.ti()) {
            return undefined;
        }

        return my.ti[0].keys().length;
    };
    that.n_top_images = n_top_images;

    total_tokens = function (callback) {
        if (!my.total_tokens) {
            my.worker.callback("total_tokens", function (tot) {
                my.total_tokens = tot;
                callback(tot);
            });
            my.worker.postMessage({ what: "total_tokens" });
        } else {
            callback(my.total_tokens);
        }
    };
    that.total_tokens = total_tokens;

    topic_total = function (t, callback) {
        var topic = isFinite(t) ? t : "all";
        my.worker.callback("topic_total/" + topic, callback);
        my.worker.postMessage({
            what: "topic_total",
            t: topic
        });
    };
    that.topic_total = topic_total;

    // alpha hyperparameters
    alpha = function (t) {
        if (!my.alpha) {
            return undefined;
        }

        // alpha() for all of them or alpha(t) for just one
        return isFinite(t) ? my.alpha[t] : my.alpha;
    };
    that.alpha = alpha;

    // metadata table
    meta = function (d) {
        if (!my.meta) {
            return undefined;
        }

        return my.meta.doc(d);
    };
    that.meta = meta;

    // metadata table
    meta_alsj = function (d) {
        if (!my.meta_alsj) {
            return undefined;
        }

        return my.meta_alsj.doc(d);
    };
    that.meta_alsj = meta_alsj;

    // metadata table
    meta_flickr = function (d) {
        if (!my.meta_flickr) {
            return undefined;
        }

        return my.meta_flickr.doc(d);
    };
    that.meta_flickr = meta_flickr;


    // metadata table
    meta_lpi = function (d) {
        if (!my.meta_lpi) {
            return undefined;
        }

        return my.meta_lpi.doc(d);
    };
    that.meta_lpi = meta_lpi;

    // metadata table
    meta_common = function (d) {
        if (!my.meta_common) {
            return undefined;
        }

        return my.meta_common.doc(d);
    };
    that.meta_common = meta_common;

    // metadata table
    meta_magazines = function (d) {
        if (!my.meta_magazines) {
            return undefined;
        }

        return my.meta_magazines.doc(d);
    };
    that.meta_magazines = meta_magazines;


    // expose metadata's conditional key/invert functions
    meta_condition = function (key) {
        return my.meta.condition(key);
    };
    that.meta_condition = meta_condition;

    // aggregate vocabulary of all top words for some or all topics
    vocab = function (t) {
        var result = d3.set(),
            tws;
        if (!tw()) {
            return undefined;
        }

        if (isFinite(t)) {
            // single topic
            tw(t).keys().forEach(result.add);
        } else {
            if (t === undefined) {
                // all topics
                tws = tw();
            } else {
                // array of indices
                tws = t.map(function (t) {
                    return that.tw(t);
                });
            }
            tws.forEach(function (topic) {
                topic.keys().forEach(function (w) {
                    result.add(w);
                });
            });
        }

        return result.values().sort();
    };
    that.vocab = vocab;

    // scaled coordinates for topics
    topic_scaled = function (t) {
        if (!my.topic_scaled) {
            return undefined;
        }

        // topic_scaled() for all of them
        if (t === undefined) {
            return my.topic_scaled;
        }

        // topic_scaled(t) for coordinates for topic t
        return my.topic_scaled[t];
    };
    that.topic_scaled = topic_scaled;

    // get aggregate topic counts over some metadata category v
    conditional_total = function (v, key, callback) {
        var k = (key === undefined) ? "all" : key,
            f = (k !== "all") ? callback
                : function (tot) {
                    callback(d3.map(tot));
                };

        my.worker.callback("conditional_total/" + v + "/" + k, f);
        my.worker.postMessage({
            what: "conditional_total",
            v: v,
            key: k
        });
    };
    that.conditional_total = conditional_total;

    // conditional proportions for topic t
    topic_conditional = function (t, v, callback) {
        var topic = (t === undefined) ? "all" : t,
            f;
        if (topic === "all") {
            f = function (cond) {
                callback(cond.map(d3.map));
            };
        } else {
            f = function (cond) {
                callback(d3.map(cond));
            };
        }
        my.worker.callback("topic_conditional/" + v + "/" + topic, f);
        my.worker.postMessage({
            what: "topic_conditional",
            t: topic,
            v: v
        });
    };
    that.topic_conditional = topic_conditional;

    // Get n top documents for topic t. Uses a naive document ranking,
    // by the proportion of words assigned to t, which does *not*
    // necessarily give the docs where t is most salient
    topic_docs = function (t, n, searchQuery, callback) {
        // brute force solution for top n docs within a category:
        // rank all of them, then take the top n

        my.worker.callback(
            ["topic_docs", t, n, searchQuery].join("/"),
            callback);
        my.worker.postMessage({
            what: "topic_docs",
            t: t,
            searchQuery: searchQuery,
            n: n
        });
    };
    that.topic_docs = topic_docs;

    // Like topic docs, but restrict to docs with v == key
    topic_docs_conditional = function (t, v, key, n, searchQuery, callback) {

        my.worker.callback(
                ["topic_docs_conditional", t, v, key, n, searchQuery].join("/"),
                callback);
        my.worker.postMessage({
            what: "topic_docs_conditional",
            t: t,
            v: v,
            key: key,
            searchQuery: searchQuery,
            n: n
        });
    };
    that.topic_docs_conditional = topic_docs_conditional;

    // Get n top topics for document d. Unlike with docs, no reason to
    // go to lengths to avoid sorting n_topics entries, since
    // n_topics << n_docs. The expensive step is the row slice, which we
    // have to do anyway.
    doc_topics = function (d, n, callback) {
        my.worker.callback("doc_topics/" + d + "/" + n, callback);
        my.worker.postMessage({
            what: "doc_topics",
            d: d,
            n: n
        });
    };
    that.doc_topics = doc_topics;

    // Get n top words for topic t.
    topic_words = function (t, n) {
        var n_words = n || this.n_top_words(),
            words;
        if (t === undefined) {
            return d3.range(this.n()).map(function (topic) {
                return that.topic_words(topic, n);
            });
        }

        words = this.tw(t).entries(); // d3.map method
        words.sort(function (w1, w2) {
            return d3.descending(w1.value, w2.value) ||
                d3.ascending(w1.key, w2.key); // stabilize sort: alphabetical
        });

        return utils.shorten(words, n_words, function (ws, i) {
            return ws[i].value;
        })
            .map(function (w) {
                return {
                    word: w.key,
                    weight: w.value
                };
            });
    };
    that.topic_words = topic_words;

    // Get n top words for topic t.
    topic_authors = function (t, n) {
        var n_authors = n || this.n_top_authors(),
            authors;
        if (t === undefined) {
            return d3.range(this.n()).map(function (topic) {
                return that.topic_authors(topic, n);
            });
        }

        authors = this.ta(t).entries(); // d3.map method
        authors.sort(function (w1, w2) {
            return d3.descending(w1.value, w2.value) ||
                d3.ascending(w1.key, w2.key); // stabilize sort: alphabetical
        });

        return utils.shorten(authors, n_authors, function (ws, i) {
            return ws[i].value;
        })
            .map(function (w) {
                return {
                    author: w.key,
                    weight: w.value
                };
            });
    };
    that.topic_authors = topic_authors;

    // Get n top images for topic t.
    topic_images = function (t, n) {
        var n_images = n || this.n_top_images(),
            images;
        if (t === undefined) {
            return d3.range(this.n()).map(function (topic) {
                return that.topic_images(topic, n);
            });
        }

        images = this.ti(t).entries(); // d3.map method
        images.sort(function (w1, w2) {
            return d3.descending(w1.value, w2.value) ||
                d3.ascending(w1.key, w2.key); // stabilize sort: alphabetical
        });

        images = utils.shorten(images, n_images, function (ws, i) {
            return ws[i].value;
        })
            .map(function (w) {
                var image = that.meta_images(w.key);
                if (image === undefined) {
                    console.log('undefined image: ' + w.key);
                    return undefined;
                    }
                return {
                    id: w.key,
                    imgid: image.imgdid,
                    url: image.url,
                    doc_ids: image.doc_ids,
                    weight: w.value
                };
            });
        images = images.filter(function (a) {return a!== undefined;});
        return images;
    };
    that.topic_images = topic_images;

    // Get n top topics for a word.
    word_topics = function (word, n) {
        var t, row, word_wt,
            n_topics = n || this.n_top_words(),
            result = [],
            calc_rank = function (row) {
                // zero-based rank = (# of words strictly greater than word)
                return row.values().reduce(function (acc, cur) {
                    return cur > word_wt ? acc + 1 : acc;
                },
                    0);
            };

        for (t = 0; t < this.n(); t += 1) {
            row = this.tw(t);
            if (row.has(word)) {
                word_wt = row.get(word);
                result.push({
                    topic: t,
                    rank: calc_rank(row)
                });
            }
        }
        result.sort(function (a, b) {
            return d3.ascending(a.rank, b.rank) ||
                d3.ascending(a.topic, b.topic); // stabilize sort
        });
        return utils.shorten(result, n_topics, function (topics, i) {
            return topics[i].rank;
        });
    };
    that.word_topics = word_topics;

    topic_label = function (t) {
        var t_s = String(t + 1);
        // expect names keyed to 1-indexed numbers (easier to edit)
        if (my.info.topic_labels && my.info.topic_labels[t_s]) {
            return my.info.topic_labels[t_s];
        }

        // default name: use a no-break space
        return "Topic" + "\u00a0" + t_s;
    };
    that.topic_label = topic_label;

    // load tw from a string of JSON
    set_tw = function (tw_s) {
        var parsed;

        if (typeof tw_s !== 'string') {
            return;
        }

        parsed = JSON.parse(tw_s);
        my.alpha = parsed.alpha;
        my.tw = parsed.tw.map(function (topic) {
            var result = d3.map();
            topic.words.map(function (w, j) {
                result.set(w, topic.weights[j]);
            });
            return result;
        });

        my.ta = parsed.ta.map(function (topic) {
            var result = d3.map();
            topic.authors.map(function (w, j) {
                result.set(w, topic.weights[j]);
            });
            return result;
        });

        my.ti = parsed.ti.map(function (topic) {
            var result = d3.map();
            topic.images.map(function (w, j) {
                result.set(w, topic.weights[j]);
            });
            return result;
        });

        if (!my.n) {
            my.n = my.alpha.length;
        }
    };
    that.set_tw = set_tw;

    // load dt from a string of JSON
    // callback should take one parameter, a Boolean indicating success
    set_dt = function (dt_s, callback) {
        if (typeof dt_s  !== 'string') {
            callback(false);
        }

        my.worker.callback("set_dt", function (result) {
            my.ready.dt = result;
            callback(result);
        });
        my.worker.postMessage({
            what: "set_dt",
            dt: JSON.parse(dt_s)
        });
    };
    that.set_dt = set_dt;

    set_meta = function (meta) {
        var i,
            doc,
            doc_lemmas = [];
        my.meta = meta;

        // cache metadata variable information for each doc
        meta.conditionals().forEach(doc_category);
        doc_category('author', function (doc) {return doc.authors;});

        for (i=0; i < n_docs(); i++) {
            doc = meta.doc(i);
            doc_lemmas.push(doc.lemmas);
            }

        my.worker.callback("set_doc_lemmas", function (result) {
            my.ready.doc_lemmas = result;
            //callback(result);
        });
        my.worker.postMessage({
            what: "set_doc_lemmas",
            doc_lemmas: doc_lemmas
        });
    };
    that.set_meta = set_meta;


    set_meta_alsj = function (meta) {
        my.meta_alsj = meta;
    };
    that.set_meta_alsj = set_meta_alsj;

    set_meta_flickr = function (meta) {
        my.meta_flickr = meta;
    };
    that.set_meta_flickr = set_meta_flickr;

    set_meta_lpi = function (meta) {
        my.meta_lpi = meta;
    };
    that.set_meta_lpi = set_meta_lpi;

    set_meta_common = function (meta) {
        my.meta_common = meta;
    };
    that.set_meta_common = set_meta_common;

    set_meta_magazines = function (meta) {
        my.meta_magazines = meta;
    };
    that.set_meta_magazines = set_meta_magazines;


    doc_category = function (v, f) {
        //  v = date,   f= function (doc) {return formatter(doc[p.field]); }
        var doc_keys;
        // calculate and store document keys
        // doc_keys = [2009, 2009, ....] length is nnumber of docs
        doc_keys = my.meta.doc().map(f);

        my.worker.callback("set_doc_categories/" + v, function (result) {
            if (!my.ready.doc_categories) {
                my.ready.doc_categories = { };
            }
            my.ready.doc_categories[v] = result;
        });
        my.worker.postMessage({
            what: "set_doc_categories",
            v: v,
            keys: doc_keys
        });
    };
    that.doc_category = doc_category;

    // load scaled topic coordinates from a string of CSV lines
    set_topic_scaled = function (ts_s) {
        var s;
        if (typeof ts_s  !== 'string') {
            return;
        }

        // strip blank "rows" at start or end
        s = ts_s.replace(/^\n*/, "")
            .replace(/\n*$/, "\n");
        my.topic_scaled = d3.csv.parseRows(s, function (row) {
            return row.map(parseFloat);
        });
    };
    that.set_topic_scaled = set_topic_scaled;

    return that;
};
