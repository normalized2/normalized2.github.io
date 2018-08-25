/*global view, VIS, set_view, utils, d3 */
"use strict";

view.image = function (p) {

};


view.image.set_document_title =  function(row_common) {
    // TODO:  use ' - Apollo images agregations.' form info.json options
    var page_title = utils.format("AS{mission}-{magazine}-{number}", row_common)
    d3.select("p#image_AS_title").text(page_title);
    document.title = page_title + ' - ' + VIS.title;
};

view.image.set_next_prev =  function(row_common) {
    var number_next, number_prev, a, p;

    this.current_number = row_common.number;
    this.numbers_next = row_common.next.split(',');
    this.numbers_prev = row_common.prev.split(',');

    number_next = row_common.next.split(',');
    if (number_next.length !=0) {
        p = d3.select("p#image_next");
        p.classed("hidden", false)
        number_next = this.numbers_next[0];
        var func_next = function (w) {
                d3.event.preventDefault();
                view.image.next();
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
        number_prev = this.numbers_prev[number_prev.length - 1];
        var func_prev = function (w) {
                d3.event.preventDefault();
                view.image.prev();
            };
        a = d3.select("#image_view_prev");
        a.on("click", func_prev);
        a.text("<<< " + number_prev);
        a = d3.select("#td_image_view_prev");
        a.on("click", func_prev);

    } else {
        p = d3.select("p#image_prev");
        p.classed("hidden", true)
    }
};


view.image.next = function () {
    var number_next = this.numbers_next[0];
    view.dfb().set_view("/doc?image=" + number_next);
}


view.image.prev = function () {
    var number_prev = this.numbers_prev[this.numbers_prev.length - 1];

    //d3.event.preventDefault();
    view.dfb().set_view("/doc?image=" + number_prev);
}


view.image.show_links_to_sources = function(links_desc) {
    var max_items = 9;
    var k, key, trs;
    var keys_values = [];

    for (k in links_desc) {
        keys_values[keys_values.length] = [k, links_desc[k]]
    };

    var remains = max_items  - keys_values.length;
    for (k=0; k<remains; k++) {
        keys_values[keys_values.length] = ['', '#'];
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

};


view.image.show_img_urls = function(img_urls_list) {
    var trs;

        trs = d3.select("table#links_img_urls tbody")
        .selectAll("tr")
        .data(img_urls_list);

    trs.enter().append("tr");
    trs.exit().remove();

    // clear rows
    trs.selectAll("td").remove();

    trs.append("td")
        .attr('class', 'links')
        .append('a')
            .attr('target', '_blank')
            .attr('href', function (doc) {return doc.url;})
            .text(function (doc) {return doc.title;});

};


view.image.get_img_list_flickr = function (row) {
    // return [{'title': 'Large 2000x2000', 'url': ''}, {'title': 'Original 4000x4000', 'url': ''}]
    var sizes_table = utils.get_flickr_sizes_table(row);

    sizes_table = sizes_table.filter(function(d) {
        // TODO: defin filter list in VIS or in info.json and in options of user.
        return (VIS.flickr_sizes.indexOf(d.chars) >= 0);
    });

    var res = sizes_table.map(function(d) {
        return {
            'title': 'Flickr (' + d.width + ' x ' + d.height + ')',
            'url': utils.get_flickr_url(row, d.chars, sizes_table)
        };
    });
    return res;
};


view.image.bind_events = function() {
    var EVENT_KEY_DOWN = 'keydown';
    // TODO: change document.getElementById to jsQueary or d3js
    var element = document.getElementById('doc_view');

    removeListener(element.ownerDocument, EVENT_KEY_DOWN, this.onKeyDown);
    addListener(element.ownerDocument, EVENT_KEY_DOWN, this.onKeyDown = view.image.keydown.bind(this));
};


view.image.unbind_events = function() {
    var EVENT_KEY_DOWN = 'keydown';
    // TODO: change document.getElementById to jsQueary or d3js
    var element = document.getElementById('doc_view');

    removeListener(element.ownerDocument, EVENT_KEY_DOWN, this.onKeyDown);
};


view.image.keydown = function(e) {
  //var options = this.options;

  //if (!this.fulled || !options.keyboard) {
  //  return;
  //}

  switch (e.keyCode || e.which || e.charCode) {
    // ArrowLeft
    case 37:
      this.prev();
      break;

    // ArrowRight
    case 39:
      this.next();
      break;

    case 69:
      if (e.ctrlKey) {
        console.log('Ctrl+E');
        e.preventDefault(); 
      }
      break;

    default:
  }
}


//  from viewerjs.
// TODO: place somewhere to utils ? 

  var IN_BROWSER = typeof window !== 'undefined';
  var WINDOW = IN_BROWSER ? window : {};

  var REGEXP_SPACES = /\s\s*/;
  var onceSupported = function () {
    var supported = false;

    if (IN_BROWSER) {
      var once = false;
      var listener = function listener() {};
      var options = Object.defineProperty({}, 'once', {
        get: function get$$1() {
          supported = true;
          return once;
        },


        /**
         * This setter can fix a `TypeError` in strict mode
         * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Getter_only}
         * @param {boolean} value - The value to set
         */
        set: function set$$1(value) {
          once = value;
        }
      });

      WINDOW.addEventListener('test', listener, options);
      WINDOW.removeEventListener('test', listener, options);
    }

    return supported;
  }();



/**
   * Remove event listener from the target element.
   * @param {Element} element - The event target.
   * @param {string} type - The event type(s).
   * @param {Function} listener - The event listener.
   * @param {Object} options - The event options.
   */
  function removeListener(element, type, listener) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    var handler = listener;

    type.trim().split(REGEXP_SPACES).forEach(function (event) {
      if (!onceSupported) {
        var listeners = element.listeners;


        if (listeners && listeners[event] && listeners[event][listener]) {
          handler = listeners[event][listener];
          delete listeners[event][listener];

          if (Object.keys(listeners[event]).length === 0) {
            delete listeners[event];
          }

          if (Object.keys(listeners).length === 0) {
            delete element.listeners;
          }
        }
      }

      element.removeEventListener(event, handler, options);
    });
  }

  /**
   * Add event listener to the target element.
   * @param {Element} element - The event target.
   * @param {string} type - The event type(s).
   * @param {Function} listener - The event listener.
   * @param {Object} options - The event options.
   */
  function addListener(element, type, listener) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    var _handler = listener;

    type.trim().split(REGEXP_SPACES).forEach(function (event) {
      if (options.once && !onceSupported) {
        var _element$listeners = element.listeners,
            listeners = _element$listeners === undefined ? {} : _element$listeners;


        _handler = function handler() {
          for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }

          delete listeners[event][listener];
          element.removeEventListener(event, _handler, options);
          listener.apply(element, args);
        };

        if (!listeners[event]) {
          listeners[event] = {};
        }

        if (listeners[event][listener]) {
          element.removeEventListener(event, listeners[event][listener], options);
        }

        listeners[event][listener] = _handler;
        element.listeners = listeners;
      }

      element.addEventListener(event, _handler, options);
    });
  }
