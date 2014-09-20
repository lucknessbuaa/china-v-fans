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
require('./components/wechat-share/index');

var CONTENT_ID = 1;

function getNews(id) {
    return $.get("/contents/API/output/article/" + id + "/?format=json&content=");
}

function getNewsList(offset, limit) {
    return $.get("/contents/API/output/article/?format=json&content=" + CONTENT_ID);
}

function getBigPicture(id) {
    return $.get("/contents/API/output/bigpicture/" + id + "/?format=json&content=");
}

function getBigPictureList(offset, limit) {
    return $.get("/contents/API/output/bigpicture/?format=json");
}

function postLog(id, uid) {
    var request = $.post("/contents/API/logs", {
        option_id: id,
        uid: uid
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

var BigPicture = Backbone.View.extend({
    initialize: function(options) {
        var tpl = multpl(function() {
            /*@preserve
            <li class='picture-item'>
                <div class='cover-wrapper'>
                    <div class='cover'>
                        <img class="image" style='display:none' src='<%= image >'>
                    </div>
                </div>
            </li>
            */
        });

        this.setElement($(tpl(options).trim()));
        
        this.$wrapper = this.$el.find('.cover');
        this.$image = this.$el.find('img.image');
        this.width = window.innerWidth;
        this.height = 160;
        this.resize = false;
        //this.spinner = new Spinner({
        //    color: '#fff',
        //    lines: 12
        //});
        //this.spinner.spin(this.$wrapper[0]);
        this.$image.load(_.bind(function(){
            this.ensureSize();
          //  this.spinner.stop();
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

var StudentItem = Backbone.View.extend({
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

var StudentPage = BaseView.extend({
    initialize: function(options) {
        var tpl = multpl(function() {
            /*@preserve
            <div class='student-page'>
                <div class='big-picture scroll-banner'>
				    <p class='tip'>暂无图片</p>
                    <ul class="box picture-list list-unstyled">
                </div>
                <div class='article-list-wrapper'>
				    <p class='tip'>暂无资讯</p>
                    <ul class='article-list list-unstyled'>     
                </div>
            <div>
            */
            console.log
        });
        this.setElement($(tpl(options).trim()));
        this.$list = this.$el.find('.article-list');
        this.$imageList = this.$el.find('.picture-list');
        this.$newsWrapper = this.$el.find('.article-list-wrapper');
        this.$imageWrapper = this.$el.find('.article-list-wrapper');
    },

    show: function() {
        if (!this.itemlist) {
            this.itemlist = [];
            this.spinnerNews = new Spinner({
                color: '#fff',
                lines: 12
            });
            this.spinnerNews.spin(this.$newsWrapper);

            getNewsList(0, 10000).then(_.bind(function(data) {
                if (data.objects.length === 0) {
                    return this.$newsWrapper.addClass('empty');
                }

                this.$newsWrapper.removeClass('empty');
                _.each(data.objects, _.bind(function(article) {
                    var item = new StudentItem(article);
                    this.itemlist.push(item);
                    item.$el.appendTo(this.$list);
                }, this));
                this.spinnerNews.stop();
            }, this), _.bind(function() {
                this.$newsWrapper.children('p.tip').html('网络异常');
                this.$newsWrapper.addClass('empty');
            }, this)).always(_.bind(function() {
                this.spinnerNews.stop();
            }, this));

        } else if (this.itemlist.length !== 0) {
            this.getLoad();
        }

        if (!this.picturelist) {
            this.picturelist = [];
            this.spinnerImg = new Spinner({
                color: '#fff',
                lines: 12
            });
            this.spinnerImg.spin(this.$imageWrapper);

            getBigPictureList(0, 10000).then(_.bind(function(data) {
                if (data.objects.length === 0) {
                    return this.$imageWrapper.addClass('empty');
                }

                this.$imageWrapper.removeClass('empty');
                _.each(data.objects.data, _.bind(function(article) {
                    var item = new BigPicture(article);
                    this.picturelist.push(item);
                    item.$el.appendTo(this.$imageList);
                }, this));
                this.spinnerImg.stop();
            }, this), _.bind(function() {
                this.$imageWrapper.children('p.tip').html('网络异常');
                this.$imageWrapper.addClass('empty');
            }, this)).always(_.bind(function() {
                this.spinnerImg.stop();
            }, this));

        } else if (this.picturelist.length !== 0) {
            this.getPictureLoad();
        }
        this.$el.show();
    },

    getPictureLoad: function() {
        for (var i = 0; i < this.picturelist.length; i++) {
            this.picturelist[i].loadAgain();
        }
    },

    getLoad: function() {
        for (var i = 0; i < this.itemlist.length; i++) {
            this.itemlist[i].loadAgain();
        }
    }
});

var StudentRouter = Backbone.Router.extend({
    routes: {
        "": "all"
        //"bigpicture/:id": "bigpicture",
        //"news/:id": "news"
    },

    all: function(){
        /*if(this.studentItem){
            this.newsExit();
        }
        
        if(this.bigpicture){
            this.bigpictureExit();
        }*/

        if (!this.studentPage) {
            this.studentPage = new StudentPage();
            this.studentPage.$el.appendTo($('.content'));
            this.studentPage.show();
        }else{
            this.studentPage.show();
        }
    },

    //以下都是错误的内容，待修改
    /*newsExit: function() {
        this.detailView.destroy();
        this.detailView = null;

        Backbone.history.navigate("", {
            replace: true,
            trigger: true
        });
    },

    news: function(id){
        if (!this.studentItem) {
            this.studentItem = new StudentItem();
            this.studentItem.$el.appendTo($('.content'));
        }

        this.studentItem.setNews(id);
        this.studentItem.on('exit', _.bind(this.newsExit, this));
    },

    bigpicture: function(id){
        if (!this.bigPicture) {
            this.bigPicture = new BigPicture();
            this.bigPicture.$el.appendTo($('.content'));
        }

        this.pigPicture.setNews(id);
        this.pigPicture.on('exit', _.bind(this.bigpictureExit, this));
    }*/
});

$(function() {
    $content = $(".content");

    new StudentRouter();
    Backbone.history.start({
        root: "/student/",
        pushState: true
    });
});
