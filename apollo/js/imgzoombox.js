$(document).ready(function()
{
    $.Class.extend("Forum.ImgZoomBox",
    {
        messageClass: '.forumMessagesListMessageContent',
        messageIdReg: /forumMessagesListMessage(\d+)Content/i
    },
    {
        msgId: function(msg){
            return $(msg).attr('id').replace(this.Class.messageIdReg, '$1');
        },
        imgSize: function(img){
            return {
                natural: { w: img.naturalWidth, h: img.naturalHeight },
                rendered: { w: $(img).width(), h: $(img).height() }
            };
        },
        showZoomBox: function(src){
            var widget = this, match,
                afterImgLoad = function(img, success, error, cnt, nft){
                    if( !img || --cnt < 0 ){
                        if(typeof error === 'function') error();
                        return;
                    }
                    if( nft && (img.complete || (img.naturalWidth && img.naturalWidth !== 0)) ){
                        success();
                    }else{
                        setTimeout(function(){afterImgLoad(img, success, error, cnt, true)}, 100);
                    }
                };
            if( (match = src.match(/\/\/pbs\.twimg\.com\/media\/([a-z0-9]+)\.(jpg|gif|png)(:[a-z]+)?/i)) && match[3] !== ':orig' ) 
                src = `https://pbs.twimg.com/media/${match[1]}.${match[2]}:orig`;
            $("#zoom-box-img").attr('src', src);
            afterImgLoad($("#zoom-box-img")[0], function(){
                widget.zoomBox.css( {width: "100%", height: "100%"} );
                widget.zoomBox.show();
                $("#IZB-zoom-box-tools").show();
                widget.zoom('initial');
            }, 0, 100, false);
        },
        hideZoomBox: function(){
            this.zoomBox.css( {width: "0px", height: "0px"} );
            this.zoomBox.hide();
            $("#IZB-zoom-box-tools").hide();
            $("#zoom-box-img").attr('src', '');
        },
        // is Not for Zoom?
        isNfZ: function(img){ 
            var isz = this.imgSize(img), MIN_IMAGE_SIZE = 100;
            if( $(img).attr('src').match(/https:\/\/pbs\.twimg\.com\/media\//i) ) return false;
            return ( isz.natural.w == isz.rendered.w && isz.natural.h == isz.rendered.h ) || isz.natural.w < MIN_IMAGE_SIZE || isz.natural.h < MIN_IMAGE_SIZE;
        },
        // set new zoom
        zoom: function(command, val){
            if( this.zoomBox.width() == 0 || this.zoomBox.height() == 0 ) return;
            command = command || 'same';
            val = val || 0;
            var isz = this.imgSize( $("#zoom-box-img")[0] );
            isz.win = { w: this.zoomBox.width() - 20, h: this.zoomBox.height() - $("#IZB-zoom-box-tools").height() - 20 };
            isz.zoom = Math.round((isz.rendered.w / isz.natural.w) * 100);
            var ar = isz.natural.w / isz.natural.h, 
                arx = isz.natural.w / isz.win.w,
                ary = isz.natural.h / isz.win.h;
            // scroll-button size
            var sbsize = ( window.innerWidth == $(window).width() )? 18 : window.innerWidth - $(window).width();
            switch(command){
                case 'same': 
                    isz.snew = {w: isz.rendered.w, h: isz.rendered.h};
                    break;
                case 'initial': 
                    isz.snew = ( arx > 1 || ary > 1 )?
                        (( arx > ary )? {w: isz.win.w, h: isz.win.w / ar} : {w: isz.win.h * ar, h: isz.win.h})
                        : {w: isz.natural.w, h: isz.natural.h};
                    break;
                case 'orig': 
                    isz.snew = {w: isz.natural.w, h: isz.natural.h};
                    break;
                case 'fitWidth': 
                    isz.snew = ( arx > ary )? {w: isz.win.w, h: isz.win.w / ar} : {w: isz.win.w - sbsize, h: (isz.win.w - sbsize) / ar};
                    break;
                case 'fitHeight': 
                    isz.snew = ( ary > arx )? {w: isz.win.h * ar, h: isz.win.h} : {w: (isz.win.h - sbsize) * ar, h: isz.win.h - sbsize};
                    break;
                case 'fitAll': 
                    isz.snew = ( arx > ary )? {w: isz.win.w, h: isz.win.w / ar} : {w: isz.win.h * ar, h: isz.win.h};
                    break;
                case 'zoomStep': 
                    val = parseInt(val);
                    if( val === 0 || isNaN(val) ) return;
                    var zStep = 10;
                    val = ( val > 0 )? 
                        ( ( isz.zoom % zStep < zStep / 2 )? zStep : 2 * zStep ) 
                        : ( ( isz.zoom % zStep < zStep / 2 )? -zStep : 0 );
                    isz.zoom = isz.zoom + val - (( isz.zoom + val ) % zStep);
                    isz.snew = {
                        w: isz.natural.w * isz.zoom / 100, 
                        h: isz.natural.h * isz.zoom / 100
                    };
                    break;
                case 'zoomTo': 
                    val = parseInt(val);
                    if( isNaN(val) || val <= 0 ) return;
                    isz.snew = {
                        w: isz.natural.w * val / 100,
                        h: isz.natural.h * val / 100
                    };
                    break;
            }
            isz.zoom = Math.round((isz.snew.w / isz.natural.w) * 100);
            isz.command = command;
            isz.sbsize = sbsize;
            //console.log(isz);
            this.renderZoom(isz);
        },
        renderZoom: function(isz){
            var mtop = (isz.win.h > isz.snew.h)? Math.round((isz.win.h - isz.snew.h) / 2) : 10,
                cwidth = ( isz.snew.h > isz.win.h )? Math.round(Math.min(isz.snew.w + isz.sbsize, isz.win.w)) : Math.round(Math.min(isz.snew.w, isz.win.w)),
                cheight = ( isz.snew.w > isz.win.w )? Math.round(Math.min(isz.snew.h + isz.sbsize, isz.win.h)) : Math.round(Math.min(isz.snew.h, isz.win.h)),
                overflow = ( cwidth == isz.snew.w && cheight == isz.snew.h )? 'hidden' : 'auto';
//                cwidth = ( isz.command === 'fitWidth' )? isz.win.w : Math.round(Math.min(isz.snew.w, isz.win.w)),
//                cheight = ( isz.command === 'fitHeight' )? isz.win.h : Math.round(Math.min(isz.snew.h, isz.win.h));
            $("#IZB-img-container").css({
                'width': cwidth + 'px',
                'height': cheight + 'px',
                'margin-top': mtop + 'px'
            });
            $("#zoom-box-img").css({
                'width': Math.round(isz.snew.w) + 'px',
                'height': Math.round(isz.snew.h) + 'px'
            });
            $("#IZB-img-container").css({
                'overflow': overflow
            });
            $("#IZB-zoom-input").val(isz.zoom + '%');
            $("#IZB-zoom-select").val('none');
            // Img dragging on/off
            if( $("#IZB-img-container")[0].clientWidth < $("#IZB-img-container").width() 
                || $("#IZB-img-container")[0].clientHeight < $("#IZB-img-container").height() ){
                this.drag.max = {
                    left: $("#zoom-box-img").width() - $("#IZB-img-container")[0].clientWidth,
                    top: $("#zoom-box-img").height() - $("#IZB-img-container")[0].clientHeight
                };
                this.draggable = true;
                $("#zoom-box-img").addClass("draggable");
            }else{
                this.draggable = false;
                $("#zoom-box-img").removeClass("draggable");
            }
        },
        // Processing page images
        doProcImages: function(){
            var widget = this;
            $(this.Class.messageClass).each(function(midx, mess){
                var mId = widget.msgId(mess), img_i = 0;
                $(mess).find('img').each(function(iidx, img){
                    if( img.complete && widget.isNfZ(img) ) return true;
                    var imgId = 'image' + mId + '_' + img_i++;
                    $(img).hover(
                        function(){
                            clearTimeout(widget.foutTimeout);
                            if( !this.complete || widget.isNfZ(this) ) return;
                            if ( widget.imgButtons.find("#IZB-zoomin").attr('imgId') == imgId && widget.imgButtons.is(":visible") ) return;
                            widget.imgButtons.hide();
                            widget.imgButtons.find("#IZB-zoomin").attr('imgId', imgId);
                            if( $(this).closest("a").length == 0 && typeof $(this).attr('id') == 'undefined' ){
                                $(this).css({cursor: "zoom-in"});
                                $(this).click(function(){
                                    widget.showZoomBox( $(this).attr('src') );
                                });
                            }
                            $(this).attr('id', imgId);
                            widget.imgButtons.css({left: $(this).offset().left + 'px', top: $(this).offset().top + 'px' }).fadeIn();
                        },
                        function(){
                            clearTimeout(widget.foutTimeout);
                            if( widget.imgButtonsCaptured || widget.imgButtons.is(":hover") ) return;
                            widget.foutTimeout = setTimeout( function(){ widget.imgButtons.fadeOut(); }, 3000);
                        }
                    );
                });
            });
        },
        init: function(){
            var widget = this;
            this.draggable = this.dragging = this.imgButtonsCaptured = false;
            this.drag = {};
            this.foutTimeout = null;
            // Zoom button on image corner
            this.imgButtons = $('<div class="IZB-img-buttons">')
                    .append(
                        $('<div id="IZB-zoomin">')
                            .click(function(){
                                var imgId;
                                if( typeof ( imgId = $(this).attr("imgId") ) !== 'undefined' ){
                                    widget.showZoomBox( $("#" + imgId).attr('src') );
                                }
                            })
                    )
                    .hover(
                        function(){
                            clearTimeout(widget.foutTimeout);
                            widget.imgButtonsCaptured = true; 
                        }, 
                        function(){
                            widget.imgButtonsCaptured = false;
                        }
                    )
                    .appendTo( $(document.body) );
            // zoomBox widget
            // First make zoom-select control
            var zoomSelContainer = '<div style="display: inline-block; float: left; margin-top: 4px; position: relative;">',
                zoomSelOptions = [
                        '<option value="none"></option>',
                        '<option value="200">200%</option>',
                        '<option value="150">150%</option>',
                        '<option value="orig">100%</option>',
                        '<option value="50">50%</option>',
                        '<option value="fitWidth">По ширине</option>',
                        '<option value="fitHeight">По высоте</option>',
                        '<option value="fitAll">Вся картинка</option>'
                    ].join('\n'),
                zoomSel, zoomInp,
                zoomSelDiv = $(zoomSelContainer)
                    .append(
                        ( zoomSel = $('<select id="IZB-zoom-select">') ).append(zoomSelOptions),
                        ( zoomInp = $('<input type="text" id="IZB-zoom-input" />') )
                    );
            // zoom selected in combobox
            zoomSel.change(function(){
                var zval = $(this).val();
                if( zval === 'none' ) return;
                isNaN( parseInt(zval) )? widget.zoom(zval) : widget.zoom('zoomTo', parseInt(zval));
            });
            // zoom typed in input
            zoomInp.change(function(){
                zoomSel.val('none');
                var zval = $(this).val();
                isNaN( parseInt(zval) )? widget.zoom('same') : widget.zoom('zoomTo', parseInt(zval));
            });
            // Make widget
            this.zoomBox = $('<div class="IZB-zoom-box" style="display: none;">')
                .append(
                    // Tool panel
                    $('<div id="IZB-zoom-box-tools">')
                        .append(
                            $('<div style="display: inline-block; margin: 0 auto;">')
                                .append(
                                    $('<div class="IZB-tool-button ztb-zoomout">')
                                        .click(function(){
                                            widget.zoom('zoomStep', -1);
                                        }),
                                    zoomSelDiv,
                                    $('<div class="IZB-tool-button ztb-zoomin">')
                                        .click(function(){
                                            widget.zoom('zoomStep', 1);
                                        }),
                                    $('<div class="IZB-tool-button ztb-zoomclose">')
                                        .click(function(){
                                            widget.hideZoomBox();
                                        })
                                )
                        ),
                    // Image panel
                    $('<div id="IZB-img-container">')
                        .append($('<img id="zoom-box-img" class="zoom-box-img">')
                            .mousedown(function(e){
                                if( !widget.draggable ) return;
                                widget.drag.cur = {
                                    left: $("#IZB-img-container").scrollLeft(),
                                    top: $("#IZB-img-container").scrollTop()
                                };
                                widget.drag.start = {
                                    x: e.clientX,
                                    y: e.clientY
                                };
                                widget.dragging = true;
                                $("#zoom-box-img").addClass("dragging");
                                return false;
                            })
                            .mousemove(function(e){
                                if( !widget.draggable || !widget.dragging ) return;
                                var d = widget.drag;
                                $("#IZB-img-container").scrollLeft( Math.min(d.cur.left - e.clientX + d.start.x, d.max.left) );
                                $("#IZB-img-container").scrollTop( Math.min(d.cur.top - e.clientY + d.start.y, d.max.top) );
                            })
                            .mouseup(function(e){
                                if( !widget.draggable ) return;
                                widget.dragging = false;
                                $("#zoom-box-img").removeClass("dragging");
                            })
                            .dblclick(function(){
                                widget.hideZoomBox();
                            })
                            .click(function(){
                                if( !widget.draggable ) widget.hideZoomBox();
                            })
                        )
                )
                .appendTo( $(document.body) );
            // For external calling of image processing
            this.procImages = function(){
                widget.doProcImages();
            };
            $(window).resize(function(){
                widget.zoom();
            });
            this.doProcImages();
        }//init()
    });
});
