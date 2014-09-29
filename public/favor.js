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

var CONTENT_ID = 5;

function getNews(id) {
    return $.get("/contents/API/output/article/" + id + "/?format=json&content=");
}

function getNewsList(offset, limit) {
    return $.get("/contents/API/output/article/?format=json&content=" + CONTENT_ID);
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
        this.width = window.innerWidth - 40;
        this.height = 160;
        this.spinner = new Spinner({
            color: '#fff',
            lines: 12
        });
        this.spinner.spin(this.$el[0]);
    },

    setNews: function(id) {
        getNews(id).then(_.bind(function(data) {
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
        this.$title = this.$el.find('.title');

        this.$clicklist = new Array(this.$title, this.$wrapper, this.$detail);
        for (index in this.$clicklist) {
            this.$clicklist[index].click(_.bind(function() {
                postLog(options.id, uid());
                Backbone.history.navigate("/" + options.id, {
                    trigger: true
                });
            }, this));
        }
        
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

var NewsView = BaseView.extend({
    initialize: function(options) {
        var tpl = multpl(function() {
            /*@preserve
            <div class='news-list-wrapper'>
				<p class='tip'>暂无资讯</p>
                <ul class='news-list list-unstyled'>
            </div>
            */
            console.log
        });
        this.setElement($(tpl(options).trim()));
        this.$list = this.$el.children('ul');
    },

    show: function() {
        if (!this.itemlist) {
            this.itemlist = [];
            this.spinner = new Spinner({
                color: '#fff',
                lines: 12
            });
            this.spinner.spin(this.$el[0]);

            getNewsList(0, 10000).then(_.bind(function(data) {
                if (data.objects.length === 0) {
                    return this.$el.addClass('empty');
                }

                this.$el.removeClass('empty');
                _.each(data.objects, _.bind(function(article) {
                    var item = new NewsItem(article);
                    this.itemlist.push(item);
                    item.$el.appendTo(this.$list);
                }, this));
                this.spinner.stop();
            }, this), _.bind(function() {
                this.$el.children('p.tip').html('网络异常');
                this.$el.addClass('empty');
            }, this)).always(_.bind(function() {
                this.spinner.stop();
            }, this));

        } else if (this.itemlist.length !== 0) {
            this.getLoad();
        }
        this.$el.show();
    },

    getLoad: function() {
        for (var i = 0; i < this.itemlist.length; i++) {
            this.itemlist[i].loadAgain();
        }
    }
});

var FavorRouter = Backbone.Router.extend({
    routes: {
        "": "news",
        ":id": "detail"
    },

    news: function(){
        if(this.detailView){
            this.newsExit();
        }

        if (!this.newsView) {
            this.newsView = new NewsView();
            this.newsView.$el.appendTo($('.content'));
        }

        this.newsView.show();

        wechatshare(_.bind(function(){
            return {
                link: "http://wx.jdb.cn/",
                desc: "夏天有三宝，V罐、好声音、加多宝",
                title: "正宗凉茶的无限可能",
                img_url: 'http://wx.jdb.cn/static/img/share.jpg'
            }
        }, this));
    },

    newsExit: function() {
        if (this.detailView) {
            this.detailView.destroy();
            this.detailView = null;
        }
    },

    detail: function(id){
        this.detailView = new DetailView();
        this.detailView.$el.appendTo($('.content'));

        this.detailView.setNews(id);
    }
});

$(function() {
    $content = $(".content");

    new FavorRouter();
    Backbone.history.start({
        root: "/favor/"
        //pushState: true
    });
});
