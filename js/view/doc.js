/*global view, VIS, set_view, bib, utils, d3 */
"use strict";

view.doc = function (p) {
    var div = d3.select("div#doc_view"),
        total_tokens = p.total_tokens,
        topics = p.topics,
        trs, as_t, s;

    d3.select("#doc_view_main").classed("hidden", false);

    s = "<b>" + p.author + "</b>";
    s += " <span style='color: #909090; font-size:0.8em;'>" + d3.time.format.utc("%Y-%m-%d %H:%M")(p.date) + "</span>";
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
            .html(p.parent_doc.content);
    }
    else {
        div.select("div#doc_parent").classed('hidden', true);
    }

    div.select("div#doc_content")
        .html(p.content);

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

