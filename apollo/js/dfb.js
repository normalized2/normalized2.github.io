/*global d3, $, JSZip, utils, model, view, metadata, VIS, window, document */
"use strict";

var dfb = function (spec) {
    var my = spec || { },
        that = { },
        settings_modal,
        model_view_list, // helper functions for model subviews
        model_view_plot,
        model_view_conditional,
        refresh,
        set_view,
        hide_topics,
        setup_listeners, // initialization
        load_data,
        load;

    // Constructor: call constructors for model, metadata, bib
    my.m = model();
    // no need to globally expose the model, but handy for debugging
    // __DEV_ONLY__
    // VIS.m = my.m;
    // __END_DEV_ONLY__

    // and tell view who we are
    if (view.dfb() === undefined) {
        view.dfb(that);
    } else {
        view.error(
            "view.dfb already defined: dfb() called more than once?"
        );
    }

    // set up view routing table
    my.views = d3.map();

// Principal view-generating functions
// -----------------------------------



my.views.set("doc", function (d) {
    var div = d3.select("div#doc_view"),
        doc = +d,
        rows,
        all_doc,
        df_alsj, df_flickr,
        rows,
        row,
        p, t;

    if (!my.m.meta_flickr() || !my.m.meta_alsj()) {
        view.loading(true);
        return true;
    }


    //alert(Object.keys(my.m.doc_category));

    //all_doc = my.m.meta(undefined);
    //rows = all_doc.filter(function(r) { return r.doi  == d['image'];});
    //console.log("rows:");
    //console.log(rows);
    //d3.select("p#doc_title").text(rows[0].title);


    df_alsj = my.m.meta_alsj(undefined);

    rows = df_alsj.filter(function(r) { return r.number  == d['image'];});

    row = rows[0];

    d3.select("p#image_AS_title").text(row.title);

    p = d3.select("p#image_time");
    p.classed("hidden", false);
    p.text(row.time);

    t = "https://www.hq.nasa.gov/alsj/a{mission}/AS{mission}-{magazine}-{number}.jpg";
    t = t.split('{mission}').join(row.mission)
    t = t.split('{magazine}').join(row.magazine)
    t = t.split('{number}').join(row.number)

    //p = d3.select("img#image_thumb");
    //p.classed("hidden", false);
    //p.attr('src', t);

    p = d3.select("p#image_desc_html");
    p.classed("hidden", false);
    t = row.desc_html;
    t = t.replace(/\\r\\n/g, '\n<br />');
    p.html(t);


    df_flickr = my.m.meta_flickr(undefined);
    rows = df_flickr.filter(function(r) { return r.number  == d['image'];});
    row = rows[0];

    var flickr_url = utils.get_flickr_url(row, 'c');
    d3.select("p#image_flickr_url").text(flickr_url);

    p = d3.select("img#image_thumb");
    p.classed("hidden", false);
    p.attr('src', flickr_url);


    view.loading(false);
    return true;

    // TODO nearby documents list
});


my.views.set("about", function () {
    view.about(my.m.info());
    view.loading(false);
    d3.select("#about_view").classed("hidden", false);
    return true;
});

settings_modal = function () {
    var p = {
        max_words: my.m.n_top_words(),
        max_docs: my.m.n_docs()
    };
    if (p.max_words === undefined || p.max_docs === undefined) {
        return false;
    }

    view.settings(p);

    $("#settings_modal").modal();
    return true;
};
that.settings_modal = settings_modal;


refresh = function () {
    var hash = window.location.hash,
        query,  //  != window.location.search.substring(1) as after #
        view_parsed, v_chosen, param, param_view, params_parsed,
        success = false,
        j;

    // split from query
    var hash_query = hash.split('?');
    hash = hash_query[0];
    query = hash_query[1];

    if (my.aliases) {
        my.aliases.forEach(function (pat, repl) {
            hash = hash.split(pat).join(repl);
        });
    }

    view_parsed = hash.split("/");
    if (VIS.cur_view !== undefined && !view.updating()) {
        VIS.cur_view.classed("hidden", true);
    }

    // well-formed view must begin #/
    if (view_parsed[0] !== "#") {
        view_parsed = my.default_view;
    }

    v_chosen = view_parsed[1];

    param = view_parsed.slice(2, view_parsed.length);
    param_view = param.slice();
    
    if (my.views.has(v_chosen)) {
        if (v_chosen === 'doc') {
            params_parsed = utils.parseParams(query);
            if (param_view.length === 1) {
                param_view.push(undefined);
                param_view.push(params_parsed);
                search_params.set_authors(params_parsed);
                search_params.set_words(params_parsed);
            } else {
                param_view.push(params_parsed);
            }
        }

        success = my.views.get(v_chosen).apply(that, param_view);
    }

    if (success) {
        // TODO get all view functions to report on the chosen view with this
        // mechanism, then make less kludgy
        if (typeof success === "string") {
            param = [undefined].concat(success.split("/"));
        }
        VIS.cur_view = d3.select("div#" + v_chosen + "_view");

        VIS.annotes.forEach(function (c) {
            d3.selectAll(c).classed("hidden", true);
        });
        VIS.annotes = [".view_" + v_chosen];
        for (j = 1; j < param.length; j += 1) {
            VIS.annotes[j] = VIS.annotes[j - 1] + "_" + param[j];
        }
        VIS.annotes.forEach(function (c) {
            d3.selectAll(c).classed("hidden", false);
        });
    } else {
        if (VIS.cur_view === undefined) {
            // fall back on default view
            VIS.cur_view = d3.select("div#" + my.default_view[1] + "_view");
            my.views.get("default")();
        }
        // TODO and register the correct annotations
    }

    if (!view.updating()) {
        view.scroll_top();
    }
    view.updating(false);
    // ensure hidden topics are shown/hidden (actually, with
    // asynchronous rendering this isn't perfect)
    hide_topics();

    VIS.cur_view.classed("hidden", false);

    // ensure highlighting of nav link
    d3.selectAll("#nav_main > li.active").classed("active", false);
    d3.select("li#nav_" + v_chosen).classed("active", true);

    // hide subnavs
    d3.selectAll("#nav_main li:not(.active) > .nav")
        .classed("hidden", true);
    d3.selectAll("#nav_main li.active > .nav")
        .classed("hidden", false);
};
that.refresh = refresh;

// External objects can request a change in the view with this function,
// which triggers the hashchange handler and thus a call to refresh()

set_view = function (hash) {
    window.location.hash = hash;
};
that.set_view = set_view;

hide_topics = function (flg) {
    var flag = (flg === undefined) ? !VIS.show_hidden_topics : flg;
    d3.selectAll(".hidden_topic")
        .classed("hidden", function () {
            return flag;
        });
};
that.hide_topics = hide_topics;

// initialization
// --------------

// global visualization setup
setup_listeners = function () {

    // hashchange handler
    window.onhashchange = function () {
        refresh();
    };

    // resizing handler
    $(window).resize(function () {
        if (VIS.resize_timer) {
            window.clearTimeout(VIS.resize_timer);
        }
        VIS.resize_timer = window.setTimeout(function () {
            view.updating(true);
            view.dirty("topic/conditional", true);
            refresh();
            VIS.resize_timer = undefined; // ha ha
        }, VIS.resize_refresh_delay);
    });


    // attach the settings modal to the navbar link
    d3.select("#nav_settings a").on("click", function () {
        d3.event.preventDefault();
        settings_modal();
    });

    $("#settings_modal").on("hide.bs.modal", function () {
        view.updating(true);
        refresh();
    });

};
that.setup_listeners = setup_listeners;

// data loading
// ------------

// general file-loading utility
load_data = function (target, callback) {
    var target_base, dom_data;

    if (target === undefined) {
        return callback("target undefined", undefined);
    }

    target_base = target.replace(/^.*\//, "");
    dom_data = d3.select("#m__DATA__" + target_base.replace(/\..*$/, ""));

    // preprocessed data available in DOM?
    if (!dom_data.empty()) {
        // we expect the data to be found as the text content of an
        // element with ID as selected above. Note that we are NOT parsing
        // the data into objects here, only into an unescaped string;
        // this string will then be parsed again, either as JSON or as CSV,
        // in the callback
        return callback(undefined, JSON.parse(dom_data.html()));
    }

    // otherwise, we have to fetch it

    // If the request is for a zip file, we'll unzip.
    // N.B. client-side unzipping only needed if you don't have control
    // over whether the server zips files
    if (target.search(/\.zip$/) > 0) {
        return d3.xhr(target)
            .responseType("arraybuffer")
            .get(function (error, response) {
                var zip, text;
                if (response && response.status === 200
                        && response.response.byteLength) {
                    zip = new JSZip(response.response);
                    text = zip.file(target_base.replace(/\.zip$/, "")).asText();
                }
                return callback(error, text);
            });
    }

    // Otherwise, no unzipping
    return d3.text(target, function (error, s) {
        return callback(error, s);
    });
};
that.load_data = load_data;

// main data-loader
load = function () {
    load_data(VIS.files.info,function (error, info_s) {

        // We need to know whether we got new VIS parameters before we
        // do the rest of the loading, but if info is missing, it's not
        // really the end of the world

        if (typeof info_s === 'string') {
            my.m.info(JSON.parse(info_s));

            // finish initializing VIS by loading any preferences
            // stashed in model info

            VIS.update(my.m.info().VIS);

            // now we can load the model title
            d3.selectAll(".model_title")
                .html(my.m.info().title);

            // and set the default view
            my.default_view = VIS.default_view.split("/");
            if (!my.views.has(my.default_view[1])) {
                view.warning("Invalid VIS.default_view setting.");
                // invalid default view; hard-code fallback
                my.default_view = [ "", "model"];
            }

            my.views.set("default", my.views.get(my.default_view[1]));

            // and set up view aliases by validating them
            my.aliases = d3.map(VIS.aliases);
        } else {
            view.warning("Unable to load model info from " + VIS.files.info);
        }

        // now we can set up metadata and bib objects, but we won't overwrite
        // any custom metadata or bib objects passed in at dfb() invocation;
        // this does mean, however, that such custom objects can only look in
        // at VIS parameters by directly accessing the global

        if (my.metadata_flickr === undefined) {
            if (VIS.metadata_flickr.type === "base") {
                my.metadata_flickr = metadata(VIS.metadata_flickr.spec);
            } else if (VIS.metadata_flickr.type === "flickr") {
                my.metadata_flickr = metadata.flickr(VIS.metadata_flickr.spec);
            } else {
                // default to DfR subclass if no other specified
                my.metadata_flickr = metadata.flickr();
                view.warning("Unknown metadata.type; defaulting to flickr.");
            }
        }

        if (my.metadata_alsj === undefined) {
            if (VIS.metadata_alsj.type === "alsj") {
                my.metadata_alsj = metadata.alsj(VIS.metadata_alsj.spec);
            } else {
                // default to DfR subclass if no other specified
                my.metadata_alsj = metadata.alsj();
                view.warning("Unknown metadata.type; defaulting to alsj.");
            }
        }

        // now we can install the main event listeners
        // TODO can we do this even earlier?
        setup_listeners();

        // now launch remaining data loading; ask for a refresh when done
        load_data(VIS.files.meta_flickr, function (error, meta_s) {
            if (typeof meta_s === 'string') {
                // and get the metadata object ready
                my.metadata_flickr.from_string(meta_s);

                // pass to object (also stores conditional keys)
                my.m.set_meta_flickr(my.metadata_flickr);
                refresh();
            } else {
                view.error("Unable to load metadata from " + VIS.files.meta_flickr);
            }
        });

        load_data(VIS.files.meta_alsj, function (error, meta_s) {
            if (typeof meta_s === 'string') {
                // and get the metadata object ready
                my.metadata_alsj.from_string(meta_s);
                // pass to object (also stores conditional keys)
                my.m.set_meta_alsj(my.metadata_alsj);
                refresh();
            } else {
                view.error("Unable to load metadata from " + VIS.files.meta_images);
            }
        });

        refresh();
    });
};
that.load = load;

    return that;
}; // dfb()

// execution is up to index.html:
// dfb({ ... })
//     .load();

