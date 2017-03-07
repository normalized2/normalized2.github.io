/*global view, VIS, set_view, bib, utils, d3 */
"use strict";

view.image = function (p) {
    var div = d3.select("div#image_view"),
        /*,
        total_tokens = p.total_tokens,
        topics = p.topics,
        */
        trs;


    d3.select("#doc_view_main").classed("hidden", false);

    div.select('img#image_src')
        .attr('src', '');

    div.select('a#image_url')
        .text(p.url);

    div.select('img#image_src')
        .attr('src', p.url);
};

view.image.next_prev = function (n) {
    d3.select("#image_view_next")
        .on("click", function (w) {
            d3.event.preventDefault();
            view.dfb().set_view("/image/" + (n + 1));
        });
    d3.select("#image_view_prev")
        .on("click", function (w) {
            d3.event.preventDefault();
            view.dfb().set_view("/image/" + (n - 1));
        });
};

view.image.docs = function (p) {
    // image_docs the list of docs (me3ssages) where image is used.
    var doc_ids = p.doc_ids.split(' '),
        docs = p.docs,
        trs;

    trs = d3.select("table#image_docs tbody")
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
        //.attr("href", function (w) {
         //    return "#/doc/" + w.author;
        //})
        .html(function (doc) {
            var s = '';
            s += " <p style='color: #909090'>" + d3.time.format.utc("%Y-%m-%d %H:%M")(doc.date) + "</p>";
            s += "<b>" + doc.authors + "</b> ";
            s += doc.title;
            return s;
        });
};
