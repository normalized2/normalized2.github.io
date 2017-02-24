/*global view, VIS, set_view, bib, utils, d3 */
"use strict";

view.image = function (p) {
    var div = d3.select("div#image_view"),
        /*,
        total_tokens = p.total_tokens,
        topics = p.topics,
        */
        trs, s;


    d3.select("#doc_view_main").classed("hidden", false);

    div.select('img#image_src')
        .attr('src', p.url);

    var doc_ids = p.doc_ids.split(' ');

    trs = d3.select("table#image_docs tbody")
        .selectAll("tr")
        .data(doc_ids);

    trs.enter().append("tr");
    trs.exit().remove();

    trs.on("click", function (w) {
        view.dfb().set_view("/doc/" + w);
    });

    // clear rows
    trs.selectAll("td").remove();

    trs.append("td").append("a")
        //.attr("href", function (w) {
         //    return "#/doc/" + w.author;
        //})
        .text(function (w) { return w;});

    //image_docs

};

