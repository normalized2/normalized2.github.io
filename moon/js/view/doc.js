/*global view, VIS, bib, utils, d3 */
"use strict";

view.doc = function (p) {
    var div = d3.select("div#doc_view"),
        total_tokens = p.total_tokens,
        topics = p.topics,
        trs, as_t, s;

    d3.select("#doc_view_main").classed("hidden", false);

    s = "Сообщение <b>" + p.author + "</b>";
    s += " <span style='color: #909090; font-size:0.8em;'>";
    s += d3.time.format.utc("%Y-%m-%d %H:%M")(p.date) + "</span>";
    div.select("h2#doc_header")
        .html(s);

    if (p.parentId!=="-1") {
        div.select("div#doc_parent").classed('hidden', false);

        s = p.parent_doc.authors + " ";
        s += d3.time.format.utc("%Y-%m-%d %H:%M")(p.parent_doc.date);
        div.select("a#doc_parent_link")
            .attr("href", "#/doc/" + p.parentId)
            .text(s);

        div.select("div#doc_parent_content")
            .html(p.parent_doc.content.split('\n').join('<br />'));

        s = "<b>" + p.author + "</b>";
        s += " <span style='color: #909090; font-size:0.8em;'>";
        s += d3.time.format.utc("%Y-%m-%d %H:%M")(p.date) + "</span>";
        div.select("h3#doc_author")
            .html(s);
        div.select("h3#doc_author").classed('hidden', false);
    }
    else {
        div.select("div#doc_parent").classed('hidden', true);
        div.select("h3#doc_author").classed('hidden', true);
    }

    div.select("div#doc_content")
        .html(p.content.split('\n').join('<br />'));

    div.select("#doc_remark .token_count")
        .text(p.total_tokens);

    div.select("#doc_remark a.url")
        .attr("href", p.url);

    trs = div.select("table#doc_topics tbody")
        .selectAll("tr")
        .data(topics);

    trs.enter().append("tr");
    trs.exit().remove();

    // clear rows
    trs.selectAll("td").remove();

    as_t = trs.append("td").append("a")
        .attr("href", function (t) {
            return view.topic.link(t.topic);
        })
        .classed("topic_words", true);

    as_t.append("span").classed("name", true)
        .text(function (t, j) {
            return p.labels[j];
        });

    trs.append("td").append("a")
        .attr("href", function (t) {
            return view.topic.link(t.topic);
        })
        .append("span").classed("words", true)
        .text(function (t, j) {
            return p.words[j].reduce(function (acc, x) {
                return acc + " " + x.word;
            }, "");
        });

    trs.on("click", function (t) {
        view.dfb().set_view(view.topic.hash(t.topic));
    });

    view.append_weight_tds(trs, function (t) {
        return t.weight / total_tokens;
    });

    trs.append("td")
        .classed("td-right", true)
        .text(function (t) {
            return VIS.percent_format(t.weight / total_tokens);
        });
    trs.append("td")
        .classed("td-right", true)
        .text(function (t) {
            return t.weight;
        });
};

view.doc.images = function(p) {
    var img_ids = p.img_ids.split(' '),
        images = p.images,
        tr;

    tr = d3.select("table#doc_images tbody")
        .select("tr")
        .selectAll("td")
        .data(images);

    tr.enter().append("td")
        .attr('style', 'padding: 2px;');
    tr.exit().remove();

    //trs.on("click", function (image) {
    //    view.dfb().set_view("/image/" + image.id);
    //});

    // clear rows
    tr.selectAll("a").remove();

    tr.append("a")
        .on("click", function (image) {
            view.dfb().set_view("/image/" + image.id);
        })
        .attr('href', function (image) {
            return '#/image/' +  image.id;
        })
        .append("img")
        .attr("src", function (image) {
            return image.url;
        })
        .attr('width', 128);
        //.attr('height', 64)

};

view.doc.childs = function(p) {
    var doc_ids = p.doc_ids.split(' '),
        docs = p.docs,
        trs, div;

    div = d3.select("div#doc_view_childs");

    if (docs.length !== 0) {
        div.classed('hidden', false);
        trs = d3.select("table#doc_childs tbody")
            .selectAll("tr")
            .data(docs);

        trs.enter().append("tr");
        trs.exit().remove();

        trs.on("click", function (doc) {
                view.dfb().set_view("/doc/" + doc.id);
            });

        // clear rows
        trs.selectAll("td").remove();

        trs.append("td").append("a")
            .attr('href', function (doc) {
                return "#/doc/" + doc.id;
            })
            .text( function (doc) {
                return doc.authors;
            });
    } else {
        div.classed('hidden', true);
    }

};
