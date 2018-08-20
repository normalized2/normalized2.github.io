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



my.views.set("search", function (d) {

    if (!my.m.meta_flickr() || !my.m.meta_alsj() || !my.m.meta_lpi() || !my.m.meta_common() || !my.m.meta_magazines) {
        view.loading(true);
        return true;
    }

    //

    d3.select("input#input_q")
        .attr('value', d['q']);

    view.loading(false);
    return true;

});


my.views.set("doc", function (d) {
    var div = d3.select("div#doc_view"),
        doc = +d,
        rows,
        all_doc,
        df_alsj, df_flickr, df_lpi, df_common,
        rows,
        row, row_common,
        img_url='',
        links_desc = {},
        links_img_urls = {},
        p, t, k;

    if (!my.m.meta_flickr() || !my.m.meta_alsj() || !my.m.meta_lpi() || !my.m.meta_common() || !my.m.meta_magazines) {
        view.loading(true);
        return true;
    }


    //alert(Object.keys(my.m.doc_category));

    //all_doc = my.m.meta(undefined);
    //rows = all_doc.filter(function(r) { return r.doi  == d['image'];});
    //console.log("rows:");
    //console.log(rows);
    //d3.select("p#doc_title").text(rows[0].title);

    df_common = my.m.meta_common(undefined);
    rows = df_common.filter(function(r) { return r.number  == d['image'];});
    row_common = rows[0];

    var number_next, number_prev, a;

    number_next = row_common.next.split(',');
    if (number_next.length !=0) {
        p = d3.select("p#image_next");
        p.classed("hidden", false)
        //p.text(row.next);
        number_next = number_next[0];
        var func_next = function (w) {
                d3.event.preventDefault();
                view.dfb().set_view("/doc?image=" + number_next);
            };

        a = d3.select("#image_view_next");
        a.on("click", func_next);
        a.text(number_next + " >>>");
        a = d3.select("#td_image_view_next");
        a.on("click", func_next);
    } else {
        p = d3.select("p#image_next");
        p.classed("hidden", true)
    }

    number_prev = row_common.prev.split(',');
    if (number_prev.length !=0) {
        p = d3.select("p#image_prev");
        p.classed("hidden", false)
        //p.text(row.next);
        number_prev = number_prev[number_prev.length - 1];
        var func_prev = function (w) {
                d3.event.preventDefault();
                view.dfb().set_view("/doc?image=" + number_prev);
            };
        a = d3.select("#image_view_prev");
        a.on("click", );
        a.text("<<< " + number_prev);

        a = d3.select("#td_image_view_prev");
        a.on("click", func_prev);

    } else {
        p = d3.select("p#image_prev");
        p.classed("hidden", true)
    }

    d3.select("p#image_AS_title").text(utils.format("AS{mission}-{magazine}-{number}", row_common));

    if (row_common.lpi==1) {

        var dict = {
            mission: utils.fill_left(row_common.mission, 2),
            magazine: utils.fill_left(row_common.magazine, 2),
            number: utils.fill_left(row_common.number, 3),
        }

        t = "https://www.lpi.usra.edu/resources/apollo/images/browse/AS{mission}/{magazine}/{number}.jpg";
        t = utils.format(t, dict);
        img_url = t
    }

    df_alsj = my.m.meta_alsj(undefined);

    rows = df_alsj.filter(function(r) { return r.number  == d['image'];});
    if (rows.length != 0) {
        row = rows[0];

        p = d3.select("p#image_time");
        p.classed("hidden", false);
        p.text(row.time);

        t = "https://www.hq.nasa.gov/alsj/a{mission}/AS{mission}-{magazine}-{number}.jpg";
        t = utils.format(t, row);
        img_url = t;

        //p = d3.select("img#image_thumb");
        //p.classed("hidden", false);
        //p.attr('src', t);

        p = d3.select("p#image_desc_html");
        p.classed("hidden", false);
        t = row.desc_html;
        t = t.replace(/\\r\\n/g, '\n<br />');
        p.html(t);

        links_desc['ALSJ image desc'] = utils.format('https://www.hq.nasa.gov/alsj/a{mission}/images{mission}.html#{number}', row);
        if (row.time_url) {
            t = "https://www.hq.nasa.gov/alsj/a{mission}/"
            t = utils.format(t, row);
            t = t + row.time_url;
            links_desc['ALSJ journal'] = t;
        }

    } else {
        d3.select("p#image_AS_title").text('');
        p = d3.select("p#image_desc_html");
        p.classed("hidden", true);
        p = d3.select("p#image_time");
        p.classed("hidden", true);

    }

    df_flickr = my.m.meta_flickr(undefined);
    rows = df_flickr.filter(function(r) { return r.number  == d['image'];});
    row = rows[0];

    if (rows.length != 0) {
        var flickr_url = utils.get_flickr_url(row, 'z');
        img_url = flickr_url;

        links_desc['Flickr'] = utils.get_flickr_url(row, undefined);

        t = 'https://www.flickr.com/photos/projectapolloarchive/{id}/sizes/l/';
        links_desc['Flickr all sizes'] = utils.format(t, row);

        t = 'https://www.flickr.com/photos/projectapolloarchive/albums/{album_id}';
        links_desc['Flickr album'] = utils.format(t, row);

        links_img_urls['Flickr Small 320'] = utils.get_flickr_url(row, 'n');
        links_img_urls['Flickr Large 2048'] = utils.get_flickr_url(row, 'k');
        links_img_urls['Flickr Original 4175'] = utils.get_flickr_url(row, 'o');

    } else {
        d3.select("p#image_flickr_url").text('');

        p = d3.select("img#image_thumb");
        p.classed("hidden", false);
        p.attr('src', '');
    }

    df_lpi = my.m.meta_lpi(undefined);
    rows = df_lpi.filter(function(r) { return r.number  == d['image'];});
    row = rows[0];
    if (rows.length != 0) {
        var trs;
        var names = 'Description,Feature(s),Camera Altitude,Camera Azimuth,Camera Tilt,Film Color,Film Type,Film Width,Index Map,Latitude / Longitude,Lens Focal Length,Magazine,Magazine Letter,Mission,Mission Activity,Notes,Quality,Revolution,Sun Elevation'.split(',');
        var k, key;
        var keys_values = [];

        for (k in names) {
            key = names[k];
            if (row[key]) {
                keys_values[keys_values.length] = [key, row[key]];
            }
        }

        trs = d3.select("table#image_properties tbody")
            .selectAll("tr")
            .data(keys_values);

        trs.enter().append("tr");
        trs.exit().remove();

        /*
        trs.on("click", function (doc) {
            view.dfb().set_view("/doc/" + doc.id);
        });
        */

        // clear rows
        trs.selectAll("td").remove();

        trs.append("td")
            .attr('class', 'img_prop')
            //.attr("href", function (w) {
             //    return "#/doc/" + w.author;
            //})
            .html(function (doc) {
                var s = '';
                if ((doc[0] == 'Feature(s)') || (doc[0] == 'Description')) {
                    s = doc[0] + ': &nbsp;';
                    var a = doc[1].split(/,|;/), ba;
                    a = a.map(function (item) {return $.trim(item)});
                    a = a.map(function (item) {return '<a href="#/search?q='+ encodeURIComponent(item) +'">' + item + '</a>'});
                    s += a.join(', ');
                } else {
                    s = doc[0] + ': &nbsp;'+ doc[1];
                }

                return s;
            });

        links_desc['LPI'] = utils.format("https://www.lpi.usra.edu/resources/apollo/frame/?AS{mission}-{magazine}-{number}", row_common);

        links_img_urls['LPI low'] = utils.format("https://www.lpi.usra.edu/resources/apollo/images/browse/AS{mission}/{magazine}/{number}.jpg", row_common);

        if (row['Hi Resolution Image(s)']) {
            links_img_urls['LPI print'] = utils.format('https://www.lpi.usra.edu/resources/apollo/images/print/AS{mission}/{magazine}/{number}.jpg', row_common);
        }

    } else {
        trs = d3.select("table#image_properties tbody")
            .selectAll("tr")

        // clear rows
        trs.selectAll("td").remove();
    }


    if (row_common.tothemoon==1) {
        // http://tothemoon.ser.asu.edu/gallery/apollo/AS4_Hasselblad%20(70%20mm)/list#AS4-1-40
        // http://tothemoon.ser.asu.edu/gallery/apollo/AS04_Hasselblad%20(70%20mm)/list#AS04-01-0020
        // TODO:  4 --> 04
        t = "http://tothemoon.ser.asu.edu/gallery/apollo/AS{mission}_Hasselblad%20(70%20mm)/list#AS{mission}-{magazine}-{number}";
        var dict = {
            mission: utils.fill_left(row_common.mission, 2),
            magazine: utils.fill_left(row_common.magazine, 2),
            number: utils.fill_left(row_common.number, 4),
        }
        links_desc['tothemoon'] = utils.format(t, dict);

        if (img_url == '') {
            t = 'http://tothemoon.ser.asu.edu/data_a70/AS{mission}/extra/AS{mission}-{magazine}-{number}.browse.png'
            img_url = utils.format(t, dict);
        }
    }


    if (row_common.spaceflight==1) {
        t = "https://spaceflight.nasa.gov/gallery/images/apollo/{spaceflight_page}";
        links_desc['spaceflight'] = utils.format(t, row_common);
    }

    t = "https://eol.jsc.nasa.gov/SearchPhotos/photo.pl?mission=AS{mission}&roll={magazine}&frame={number}";
    links_desc['eol.jsc'] = utils.format(t, row_common);

    if (row_common.mission == 17) {
        links_desc['See also apollo17.org'] = 'http://apollo17.org/';
    }

    p = d3.select("a#image_url");
    p.text(img_url);
    p.attr('href', img_url);

    p = d3.select("img#image_thumb");
    p.classed("hidden", false);
    p.attr('src', img_url);

    // links_desc
    var k, key;
    var keys_values = [];

    for (k in links_desc) {
        keys_values[keys_values.length] = [k, links_desc[k]]
    };


    trs = d3.select("table#links_desc tbody")
        .selectAll("tr")
        .data(keys_values);

    trs.enter().append("tr");
    trs.exit().remove();

    // clear rows
    trs.selectAll("td").remove();

    trs.append("td")
        .attr('class', 'links')
        .append('a')
            .attr('target', '_blank')
            .attr('href', function (doc) {return doc[1];})
            .text(function (doc) {return doc[0];});


    // magazines list
    var mission_list = [ 4,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17];
    var df_magazines;
    var missions_data = []

    df_magazines = my.m.meta_magazines(undefined);

    for (var i=0; i<mission_list.length; i++) {
        rows = df_magazines.filter(function(r) { return r.mission  == mission_list[i];});
        row = rows[0]
        missions_data[missions_data.length] = {
            mission: row.mission,
            number: row.number_min,
            selected: row.mission == row_common.mission
        }
    }

    trs = d3.select("table#missions_list tbody")
        .selectAll("tr")
        .data(missions_data);

    trs.enter().append("tr");
    trs.exit().remove();

    // clear rows
    trs.selectAll("td").remove();

    trs.append("td")
        .append('a')
            .attr('href', function (doc) {return '#/doc?image='+ doc.number;})
            .classed("selected", function (doc) {return doc.selected})
            .text(function (doc) {return 'Apollo ' + doc.mission;})
            .on('click', function (doc) {
                view.dfb().set_view("/doc?image=" + doc.number);
                d3.event.stopPropagation();
                return undefined;
            });


    var magazine_data = [];
    rows = df_magazines.filter(function(r) { return r.mission  == row_common.mission;});

    for (var i=0; i<rows.length; i++) {
        row = rows[i];
        magazine_data[magazine_data.length] = {
                magazine: row.magazine,
                number: row.number_min,
                selected: row.magazine == row_common.magazine
            }
    }

    trs = d3.select("table#magazines_list tbody")
        .selectAll("tr")
        .data(magazine_data);

    trs.enter().append("tr");
    trs.exit().remove();

    // clear rows
    trs.selectAll("td").remove();

    trs.append("td")
        .append('a')
            .attr('href', function (doc) {return '#/doc?image='+ doc.number;})
            .classed("selected", function (doc) {return doc.selected})
            .text(function (doc) {return 'Mag ' + doc.magazine;})
            .on('click', function (doc) {
                view.dfb().set_view("/doc?image=" + doc.number);
                d3.event.stopPropagation();
                return undefined;
            });


    view.loading(false);
    return true;

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

        if (v_chosen === 'search') {
            params_parsed = utils.parseParams(query);
            if (param_view.length === 1) {
                param_view.push(undefined);
                param_view.push(params_parsed);
                search_params.set_authors(params_parsed);  // TODO ???
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

        if (my.metadata_lpi === undefined) {
            if (VIS.metadata_lpi.type === "lpi") {
                my.metadata_lpi = metadata.lpi(VIS.metadata_lpi.spec);
            } else {
                // default to DfR subclass if no other specified
                my.metadata_lpi = metadata.lpi();
                view.warning("Unknown metadata.type; defaulting to lpi.");
            }
        }

        if (my.metadata_common === undefined) {
            if (VIS.metadata_common.type === "common") {
                my.metadata_common = metadata.common(VIS.metadata_common.spec);
            } else {
                // default to DfR subclass if no other specified
                my.metadata_common = metadata.common();
                view.warning("Unknown metadata.type; defaulting to common.");
            }
        }

        if (my.metadata_magazines === undefined) {
            if (VIS.metadata_magazines.type === "magazines") {
                my.metadata_magazines = metadata.magazines(VIS.metadata_magazines.spec);
            } else {
                // default to DfR subclass if no other specified
                my.metadata_magazines = metadata.magazines();
                view.warning("Unknown metadata.type; defaulting to magazines.");
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
                view.error("Unable to load metadata from " + VIS.files.meta_alsj);
            }
        });

        load_data(VIS.files.meta_lpi, function (error, meta_s) {
            if (typeof meta_s === 'string') {
                // and get the metadata object ready
                my.metadata_lpi.from_string(meta_s);
                // pass to object (also stores conditional keys)
                my.m.set_meta_lpi(my.metadata_lpi);
                refresh();
            } else {
                view.error("Unable to load metadata from " + VIS.files.meta_lpi);
            }
        });


        load_data(VIS.files.meta_common, function (error, meta_s) {
            if (typeof meta_s === 'string') {
                // and get the metadata object ready
                my.metadata_common.from_string(meta_s);
                // pass to object (also stores conditional keys)
                my.m.set_meta_common(my.metadata_common);
                refresh();
            } else {
                view.error("Unable to load metadata from " + VIS.files.meta_common);
            }
        });

        load_data(VIS.files.meta_magazines, function (error, meta_s) {
            if (typeof meta_s === 'string') {
                // and get the metadata object ready
                my.metadata_magazines.from_string(meta_s);
                // pass to object (also stores conditional keys)
                my.m.set_meta_magazines(my.metadata_magazines);
                refresh();
            } else {
                view.error("Unable to load metadata from " + VIS.files.meta_magazines);
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

