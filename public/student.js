var multiline = require("multiline");
var _ = require("underscore");
var multpl = require('multpl');
var sizing = require('image-sizing');
var fs = require('fs');

var $ = require("jquery");
var Backbone = require("backbone");
Backbone.$ = $;
require("velocity");
var uid = require('uid');
var Spinner = require("./components/spin.js/spin");
var alertify = require("alertify");

var CONTENT_ID = 7;

function getNews(id) {
    return $.get("/contents/API/output/article/" + id + "/?format=json&content=");
}

function getNewsList(offset, limit) {
    return $.get("/contents/API/output/article/?format=json&content=" + CONTENT_ID);
}

function getImageList(offset, limit) {
    return $.get("/contents/API/output/bigpicture/?format=json&content" + CONTENT_ID);
}

if(!localStorage.uid){
    localStorage.uid = uid();
}

function postLog(id, uid) {
    var request = $.post("/contents/API/logs", {
        option_id: id,
        uid: localStorage.uid
    }, 'json');
}

function initScroll() {
    var speed = 3000,
        curClass = 'cur';
    $('.scroll-banner').css({
        width: '100%',
        overflow: 'hidden'
    });
    var $box = $('.scroll-banner .box'),
        $btnlist = $('.btn .dot');
    if ($box.length < 1) return;
    var $bannerlist = $box.children(),
        min = 0,
        max = $bannerlist.length - 1;
    if (max < 1) return;
    var step = $box.width(),
        totalWidth = step * (max + 1);
    $bannerlist.css('width', step + 'px');
    $box.css({
        width: totalWidth + 'px',
        left: 0,
        '-webkit-transition': 'all 0.5s ease',
        '-moz-transition': 'all 0.5s ease',
        'transition': 'all 0.5s ease'
    });
    var curindex = 0;
    var moveto = function(index) {
        var toindex = index;
        toindex = toindex > min ? toindex : min;
        toindex = toindex < max ? toindex : max;
        $box.css({
            left: -toindex * step + 'px'
        });
        $btnlist.each(function(i, e) {
            if (i == toindex)
                $(e).addClass(curClass);
            else
                $(e).removeClass(curClass);
        });
        $($bannerlist[toindex]).show();
        $('.scroll-banner .name').hide();
        $($('.scroll-banner .name')[toindex]).show();
        curindex = toindex;
    };
    moveto(curindex);
    var timer = setInterval(function() {
        var toindex = (curindex + 1) % (max + 1);
        moveto(toindex);
    }, speed);
}

var ViewProto = {
    hide: function() {
        this.$el.hide()
    },

    show: function() {
        this.$el.show();
    }
}

var BaseView = Backbone.View.extend(ViewProto);

var DetailView = Backbone.View.extend({
    initialize: function(options) {
        var tpl = _.template(multiline(function() {
            /*@preserve
            <div class='news-detail'>
                <div class='title'></div>
                <div class='date'></div>
                <div class='cover-wrapper'>
                    <div class='cover'>
                    </div>
                </div>
                <div class='con hi'>
                    <div class='content-wrapper'>
                    </div>
                </div>
            </div>
            */
        }).trim());
        this.setElement($(tpl(options))[0]);

        this.$title = this.$el.find('.title');
        this.$date = this.$el.find('.date');
        this.$content = this.$el.find('.content-wrapper');
        this.$wrapper = this.$el.find('.cover');
        this.width = window.innerWidth;
        this.height = 160;
        this.spinner = new Spinner({
            color: '#fff',
            lines: 12
        });
        this.spinner.spin(this.$wrapper[0]);
        this.$el.click(_.bind(function() {
            this.trigger('exit');
        }, this));
        wechatshare(_.bind(function() {
            return {
                title: options.name,
                desc: options.contents,
                img_url: this.imageUrl || 'http://wx.jdb.cn/static/img/share.jpg'
            }
        }, this));
    },

    setNews: function(id) {
        getNews(id).then(_.bind(function(data) {
            this.$wrapper.html("");
            this.image = new Image();
            this.image.src = data.image;
            this.$image = $(this.image);

            this.$image.load(_.bind(function() {
                this.onImageLoad();
            }, this));
            this.$title[0].innerHTML = data.name;
            this.$date[0].innerHTML = "2014-08-09";
            this.$content[0].innerHTML = data.contents;
            wechatshare(_.bind(function() {
                return {
                    title: data.name || ' ',
                    desc: this.$content[0].innerText || ' ',
                    img_url: data.image || 'http://wx.jdb.cn/static/img/share.jpg'
                }
            }, this));
        }, this)).always(_.bind(function() {
            this.spinner.stop();
        }, this));
    },

    onImageLoad: function() {
        var size = sizing.cover(this.width, this.height,
            this.$image[0].naturalWidth, this.$image[0].naturalHeight);
        this.$image.css('width', size.width + 'px');
        this.$image.css('margin-left', (-size.width / 2) + 'px')
        this.$image.css('left', '50%');
        this.$image.appendTo(this.$wrapper);
    },

    destroy: function() {
        this.$el.remove();
    }
});

var NewsItem = Backbone.View.extend({
    initialize: function(options) {
        var tpl = multpl(function() {
            /*@preserve
            <li class='news-item'>
                <div class='title'><%= name %></div>
                <div class='date'>2014-08-09</div>
                <div class='cover-wrapper'>
                    <div class='cover'>
                        <img class='image' style='display: none' src='<%= image %>'>
                    </div>
                </div>
                <div class='con hi'>
                    <div class='content-wrapper'>
                        <%=contents %>
                    </div>
                </div>
                <div class='detail'><span>详情</span></div>
            </li>
            */
            console.log
        });
        this.setElement($(tpl(options).trim()));

        this.$wrapper = this.$el.find('.cover');
        this.$image = this.$el.find('img.image');
        this.$con = this.$el.find('.con');
        this.$detail = this.$el.find('.detail');

        this.$detail.click(_.bind(function() {
            postLog(options.id, uid());
            Backbone.history.navigate("/news/" + options.id, {
                trigger: true
            });
        }, this));
        this.width = window.innerWidth;
        this.height = 160;
        this.resize = false;
        this.spinner = new Spinner({
            color: '#fff',
            lines: 12
        });
        this.spinner.spin(this.$wrapper[0]);
        this.$image.load(_.bind(function() {
            this.ensureSize();
            this.spinner.stop();
        }, this));
        this.$image.error(_.bind(function() {
            this.spinner.stop();
        }, this));
    },

    ensureSize: function() {
        if (this.$image[0].naturalWidth == 0 || this.resize) {
            return;
        }
        this.resize = true;
        var size = sizing.cover(this.width, this.height,
            this.$image[0].naturalWidth, this.$image[0].naturalHeight);
        this.$image.css('width', size.width + 'px');
        this.$image.css('margin-left', (-size.width / 2) + 'px')
        this.$image.css('left', '50%');
        this.$image.show();

    },

    loadAgain: function() {
        if (this.$image[0].naturalWidth == 0) {
            this.$image.attr('src', this.$image.attr('src') + '?' + Math.random());
        } else {
            this.ensureSize();
        }
    }
});

var ImageItem = Backbone.View.extend({
    initialize: function(options) {
        var tpl = multpl(function() {
            /*@preserve
            <li class='item cover'>
                <a>
                    <img class='image' src='<%= image %>'>
                </a>
            </li>
            */
        });
        this.setElement($(tpl(options).trim()));
        this.$wrapper = this.$el.find('.cover');
        this.$image = this.$el.find('img.image');
        this.$link = this.$el.find('a');
        if(options.data){
            this.type = options.data.type;
        }

        if(options.url){
            this.$image.click(_.bind(function() {
                window.location.href = options.url;
                postLog(options.id, uid());
            }, this));
        }else if(this.type == 3){
            this.$image.click(_.bind(function() {
                window.location.href = options.data.url;
                postLog(options.id, uid());
            }, this));
        }else if(this.type == 1){
            this.$image.click(_.bind(function() {
                postLog(options.id, uid());
                Backbone.history.navigate("/news/" + options.data.id, {
                    trigger: true
                });
            }, this));
        }

        this.width = window.innerWidth;
        this.height = 175;
        this.resize = false;
        this.$image.load(_.bind(function() {
            this.ensureSize();
            //this.spinner.stop();
        }, this));
        this.$image.error(_.bind(function() {
            //this.spinner.stop();
        }, this));
    },

    ensureSize: function() {
        if (this.$image[0].naturalWidth == 0 || this.resize) {
            return;
        }
        this.resize = true;
        var size = sizing.cover(this.width, this.height,
            this.$image[0].naturalWidth, this.$image[0].naturalHeight);
        this.$image.css('width', size.width + 'px');
        //this.$image.css('margin-left', (-size.width / 2) + 'px')
        this.$image.css('left', '50%');
        this.$image.show();

    },

    loadAgain: function() {
        if (this.$image[0].naturalWidth == 0) {
            this.$image.attr('src', this.$image.attr('src') + '?' + Math.random());
        } else {
            this.ensureSize();
        }
    }
});


var StudentView = BaseView.extend({
    initialize: function(options) {
        var tpl = multpl(function() {
            /*@preserve
            <div class='all'>
                <div class='scroll-banner'>
			    	<p class='tip'>暂无大图</p>
                    <ul class='box'>
                    </ul>
                    <div class='tit'>
                        <span class='btn'></span>
                        <span class='name-list'></span>
                    </div>
                </div>
                <div class='news-list-wrapper'>
	    	     	<p class='tip'>暂无资讯</p>
                    <ul class='news-list list-unstyled'>
                    </ul>
                </div>
            </div>
            */
            console.log
        });
        this.setElement($(tpl(options).trim()));
        this.$imageList = this.$el.find('.box');
        this.$newsList = this.$el.find('.news-list');
        this.$newsWrapper = this.$el.find('.news-list-wrapper');
        this.$imageWrapper = this.$el.find('.scroll-banner');
        this.$node = this.$el.find('.tit .name-list');
        this.$dot = this.$el.find('.tit .btn');
    },

    createDot: function(){
        var oSpan = document.createElement('span');
        $(oSpan).addClass('dot');
        return oSpan;
    },

    createSpan: function(content){
        var oSpan = document.createElement('span');
        var oText = document.createTextNode(content);
        $(oSpan).addClass('name');
        oSpan.appendChild(oText);
        return oSpan;
    },

    show: function() {
        if (!this.imagelist) {
            this.imagelist = [];
            this.spinnerImage = new Spinner({
                color: '#fff',
                lines: 12
            });
            //this.spinnerImage.spin(this.$imageWrapper[0]);

            getImageList(0, 10000).then(_.bind(function(data) {
                if (data.objects.length === 0) {
                    return this.$imageWrapper.addClass('empty');
                }

                this.$imageWrapper.removeClass('empty');
                _.each(data.objects, _.bind(function(article) {
                    var image = new ImageItem(article);
                    this.imagelist.push(image);
                    image.$el.appendTo(this.$imageList);
                    var oSpan = this.createDot();
                    this.$dot[0].appendChild(oSpan);
                    oSpan = this.createSpan(article.name);
                    this.$node[0].appendChild(oSpan);
                }, this));
            }, this), _.bind(function() {
                this.$imageWrapper.children('p.tip').html('网络异常');
                this.$imageWrapper.addClass('empty');
            }, this)).always(_.bind(function() {
                //this.spinnerImage.stop();
                initScroll();
            }, this));

        } else if (this.imagelist.length !== 0) {
            this.getImageLoad();
        }

        if (!this.itemlist) {
            this.itemlist = [];
            this.spinnerNews = new Spinner({
                color: '#fff',
                lines: 12
            });
            //this.spinnerNews.spin(this.$newsWrapper[0]);

            getNewsList(0, 10000).then(_.bind(function(data) {
                if (data.objects.length === 0) {
                    return this.$el.addClass('empty');
                }

                this.$el.removeClass('empty');
                _.each(data.objects, _.bind(function(article) {
                    var item = new NewsItem(article);
                    this.itemlist.push(item);
                    item.$el.appendTo(this.$newsList);
                }, this));
            }, this), _.bind(function() {
                this.$el.children('p.tip').html('网络异常');
                this.$el.addClass('empty');
            }, this)).always(_.bind(function() {
              //  this.spinnerNews.stop();
            }, this));

        } else if (this.itemlist.length !== 0) {
            this.getNewsLoad();
        }
        this.$el.show();
    },

    getNewsLoad: function() {
        for (var i = 0; i < this.itemlist.length; i++) {
            this.itemlist[i].loadAgain();
        }
    },

    getImageLoad: function() {
        for (var i = 0; i < this.imagelist.length; i++) {
            this.imagelist[i].loadAgain();
        }
    }
});

var StudentRouter = Backbone.Router.extend({
    routes: {
        "": "all",
        "news/:id": "newsDetail" 
    },

    all: function() {
        if(this.detailView){
            this.newsExit();
        }

        if (!this.studentView) {
            this.studentView = new StudentView();
            this.studentView.$el.appendTo($('.content'));
        }
        this.studentView.show();

        wechatshare(_.bind(function(){
            return {
                link: window.location.host + "/student",
                desc: "分享一条中国好声音资讯给你,带你了解好声音台前幕后!",
                title: "加多宝中国好声音正宗V资讯",
                img_url: 'http://wx.jdb.cn/static/img/share.jpg'
            }
        }, this));
    },

    newsExit: function() {
        this.detailView.destroy();
        this.detailView = null;

        Backbone.history.navigate("", {
            replace: true,
            trigger: true
        });
    },

    newsDetail: function(id){
        if (!this.detailView) {
            this.detailView = new DetailView();
            this.detailView.$el.appendTo($('.content'));
        }

        this.detailView.setNews(id);
        this.detailView.on('exit', _.bind(this.newsExit, this));
    }

});

$(function() {
    $content = $(".content");

    new StudentRouter();
    Backbone.history.start({
        root: "/student/"
    });
});
