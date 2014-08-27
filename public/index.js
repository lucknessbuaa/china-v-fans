var multiline = require("multiline");
var _ = require("underscore");
var multpl = require('multpl');
var sizing = require('image-sizing');
var download = require("multi-download");
var fs = require('fs');

var $ = require("jquery");
var Backbone = require("backbone");
Backbone.$ = $;
require("velocity");
//require("spin");

var CONTENT_ID = 1;

function mark(id) {
    // TODO
}

function unmark(id) {
    // TODO
}

function getVideoList(offset, limit) {
    return $.get("/API/output/video/?format=json&content=" + CONTENT_ID);
}

function getPhotoList(offset, limit) {
    return $.get("/API/output/image/?format=json&content=" + CONTENT_ID);
}

function getNewsList(offset, limit) {
    return $.get("/API/output/article/?format=json&content=" + CONTENT_ID);
}

function getPhoto(id) {
    return $.get("/API/output/image/" + id + "/?format=json&content=");
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

var ImageView = Backbone.View.extend({
    initialize: function(options) {
        var tpl = _.template(multiline(function() {
            /*@preserve
            <div class='photo-view'>
                <div class='photo-wrapper'>
                </div>
                <div class='toolbar'>
                    <div class='share'><span class='glyphicon glyphicon-share'></span></div>
                    <div class='heart'><span class='glyphicon glyphicon-heart'></span></div>
                    <div class='download'><span class='glyphicon glyphicon-download-alt'></span></div>
                <div>
            </div>
            */
            console.log
        }).trim());

        this.setElement($(tpl(options))[0]);
        this.$wrapper = this.$el.find('.photo-wrapper')

        this.$share = this.$el.find('.share');
        this.$heart = this.$el.find('.heart');
        this.$download = this.$el.find('.download');

        this.$download.click(_.bind(function() {
            download([this.imageUrl]);
        }, this));

        this.$share.click(_.bind(function() {
            // TODO show share tip
        }, this));

        this.$heart.click(_.bind(function() {
            if (!this.$heart.hasClass('up')) {
                this.$heart.addClass('up');
                mark(this.imageId);
                this.markImage(this.imageId);
            } else {
                unmark(this.imageId);
                this.unmarkImage(this.imageId);
                this.$heart.removeClass('up');
            }

            this.$heart.velocity({
                'font-size': 24,
                'padding-top': 8
            }, {
                'duration': 200
            });

            this.$heart.velocity("reverse", {
                'duration': 200
            });
        }, this));

        this.$wrapper.click(_.bind(function() {
            this.trigger('exit');
        }, this));
    },

    isImageMarkd: function(id) {
        return window.localStorage ? localStorage.getItem('image-' + id) === "true" : false;
    },

    markImage: function(id) {
        if (window.localStorage) {
            localStorage.setItem('image-' + id, true);
        }
    },

    unmarkImage: function(id) {
        if (window.localStorage) {
            localStorage.setItem('image-' + id, false);
        }
    },

    setImage: function(id) {
        this.imageId = id;

        if (this.isImageMarkd(id)) {
            this.$heart.addClass('up');
        }

        getPhoto(id).then(_.bind(function(data) {
            this.imageUrl = data.image;
            this.$wrapper.html("");
            this.$image = $("<img src='" + data.image + "'>").appendTo(this.$wrapper);

            this.$image.load(_.bind(function() {
                this.onImageLoad();
            }, this));
        }, this));
    },

    onImageLoad: function() {
        var imgWidth = this.$image.width();
        var imgHeight = this.$image.height();

        var wrapperWidth = this.$wrapper.width();
        var wrapperHeight = this.$wrapper.height();

        console.log(imgWidth, imgHeight, wrapperWidth, wrapperHeight);
        this.$wrapper.scrollTop(-(wrapperHeight - imgHeight) / 2);
        if (imgWidth / imgHeight > wrapperWidth / wrapperHeight) {
            var width = imgWidth * wrapperHeight / imgHeight;
            this.$image.height(wrapperHeight);
            this.$wrapper.scrollLeft(-(wrapperWidth - width) / 2);
        } else {
            this.$image.width(wrapperWidth);
            this.$wrapper.scrollTop(0);
        }
    },

    fadeIn: function() {
        this.$el.velocity("fadeIn");
    },

    fadeOut: function(callback) {
        this.$el.velocity("fadeOut", {
            complete: callback
        });
    },

    destroy: function() {
        this.$el.remove();
    }
});

var PhotoCell = Backbone.View.extend({
    initialize: function(options) {
        var tpl = _.template(multiline(function() {
            /*@preserve
            <li class='photo-item'>
                <div class='photo-item-inner'>
                    <div class='photo-wrapper'>
                        <img src='<%= image %>' onError="this.src='http://placehold.it/200x360/fff&text=!'">
                    </div>
                    <div class='title'><%= name %></div>
                    <div class='likes'>
                        <span class='glyphicon glyphicon-heart'></span>&nbsp;<%= likes %>
                    </div>
                </div>
            </li>
            */
            console.log
        }).trim()); 
        this.setElement($(tpl(options))[0]);
        this.$el.click(_.bind(function() {
            this.trigger('click');
        }, this));
    }
});

var VideoItem = Backbone.View.extend({
    initialize: function(options) {
        var tpl = _.template(require("./tpl/videoItem.html").trim());
        this.setElement($(tpl(options).trim()));

        this.$wrapper = this.$el.find('.cover');
        this.$image = this.$el.find('img.image');
        this.$image.load(_.bind(function() {
            var size = sizing.cover(this.$wrapper.width(), this.$wrapper.height(),
                this.$image.width(), this.$image.height());

            this.$image.css('width', size.width + 'px');
            this.$image.css('margin-left', (-size.width / 2) + 'px')
            this.$image.css('left', '50%');
            this.$image.show();
        }, this));
    }
});

var VideoListView = BaseView.extend({
    initialize: function(options) {
        var tpl = multpl(function() {
            /*@preserve
            <div class='video-list-wrapper' id="load">
                <ul class='video-list list-unstyled'>
            </div>
            */
            console.log
        });
        this.setElement($(tpl(options).trim()));
        this.$list = this.$el.children('ul');
        //var target = document.getElementById('load');
        //new Spinner({color:'#fff', lines: 12}).spin(target);

        getVideoList(0, 10000).then(_.bind(function(data) {
            _.each(data.objects, _.bind(function(video) {
                var item = new VideoItem(video);
                item.$el.appendTo(this.$list);
            }, this));
        }, this), function() {
            // TODO
        });
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
                        <a href='#' class='btn-play'></a>
                    </div>
                </div>
                <div class='con hi'>
                    <div class='content-wrapper'>
                        <%=contents %>
                    </div>
                </div>
                <div class='open'><span>展开</span></div>
            </li>
            */
            console.log
        });
        this.setElement($(tpl(options).trim()));

        this.$wrapper = this.$el.find('.cover');
        this.$image = this.$el.find('img.image');
        this.$open = this.$el.find('.open');
        this.$con = this.$el.find('.con');
        this.$open.click(function() {
            var temp = $(this).parent().children()[3];
            var $temp = $(temp);
            if ($temp.hasClass('hi')) {
                $temp.removeClass('hi');
                $temp.velocity({
                    'max-height': ($('.content-wrapper').outerHeight() + 8) + 'px'
                });
                $(this).children()[0].innerHTML = '收起';
            } else {
                $temp.addClass('hi');
                $temp.velocity({
                    'max-height': '65px'
                });
                $(this).children()[0].innerHTML = '展开';
            }
        });
        this.$image.load(_.bind(function() {
            console.log('resizing image', this.$wrapper.width(), this.$wrapper.height(), this.$image.width(), this.$image.height());
            var size = sizing.cover(this.$wrapper.width(), this.$wrapper.height(),
                this.$image.width(), this.$image.height());

            this.$image.css('width', size.width + 'px');
            this.$image.css('margin-left', (-size.width / 2) + 'px')
            this.$image.css('left', '50%');
            this.$image.show();
        }, this));
    }
});

var NewsView = BaseView.extend({
    initialize: function(options) {
        var tpl = multpl(function() {
            /*@preserve
            <div class='news-list-wrapper'>
                <ul class='news-list list-unstyled'>
            </div>
            */
            console.log
        });
        this.setElement($(tpl(options).trim()));
        this.$list = this.$el.children('ul');
        //new Spinner({color:'#fff', lines: 12}).spin(target);

        getNewsList(0, 10000).then(_.bind(function(data) {
            _.each(data.objects, _.bind(function(article) {
                var item = new NewsItem(article);
                item.$el.appendTo(this.$list);
            }, this));
        }, this), function() {
            // TODO
        });
    }
});

var PhotoListView = BaseView.extend({
    initialize: function(options) {
        var tpl = _.template(multiline(function() {
            /*@preserve
            <div class='photo-list-wrapper'>
                <ul class='photo-list clearfix list-unstyled'>
                </ul>
            </div>
            */
            console.log
        }).trim());

        this.setElement($(tpl(options))[0]);
        this.$list = this.$el.find('.photo-list');
        //new Spinner({color:'#fff', lines: 12}).spin(target);

        this.photoList = [];
        getPhotoList(0, 20).then(_.bind(function(data) {
            this.photoList = data.objects;
            this.render();
        }, this));
    },

    render: function() {
        _.each(this.photoList, _.bind(function(photo) {
            var view = new PhotoCell(photo);
            view.on('click', _.bind(function() {
                Backbone.history.navigate("/photo/" + photo.id, {
                    replace: 'pushState',
                    trigger: true
                });
            }, this));
            view.$el.appendTo(this.$list);
        }, this));
    }
});

var TabView = Backbone.View.extend({
    initialize: function(options) {
        var tpl = _.template(multiline(function() {
            /*@preserve
            <ul class="nav nav-tabs header" role="tablist">
                <li class="active"><a href="photo">正宗V海报</a></li>
                <li><a href="video">正宗V视频</a></li>
                <li><a href="news">正宗V资讯</a></li>
            </ul> 
             */
            console.log
        }).trim());

        this.setElement($(tpl())[0]);

        var self = this;

        this.$el.on('click', 'a', function(e) {
            e.preventDefault();

            var $this = $(this);
            var tab = $this.attr('href');
            self.activate(tab);
        });

        this.views = {};
    },

    activate: function(tab) {
        Backbone.history.navigate(tab, {
            replace: 'replaceState'
        });

        var activeTab = this.getActiveTab();
        if (activeTab === tab) {
            return;
        }

        this.$el.find("a[href=" + activeTab + "]").parent().removeClass('active');
        this.views[activeTab] && this.views[activeTab].hide();
        this.$el.find("a[href=" + tab + "]").parent().addClass('active');
        this.views[tab] && this.views[tab].show();
    },

    addTab: function(tabname, view) {
        this.views[tabname] = view;
    },

    getActiveTab: function() {
        var $link = this.$el.find('li.active').children('a');
        return $link.length > 0 ? $link.attr('href') : '';
    }
});

var $content, tabView, photoListView, newsView, videoListView;

var FansRouter = Backbone.Router.extend({
    routes: {
        "photo": "photoList",
        "photo/:id": "photo",
        "video": "video",
        "news": "news"
    },

    ensureTab: function(tab) {
        if (!tabView) {
            tabView = new TabView
            tabView.$el.appendTo(document.body);
            
            photoListView = new PhotoListView();
            tabView.addTab('photo', photoListView);

            videoListView = new VideoListView();
            tabView.addTab('video', videoListView);

            newsView = new NewsView();
            tabView.addTab('news', newsView);

            _.each([photoListView, videoListView, newsView], function(view) {
                view.$el.hide();
                view.$el.appendTo($content);
            });
        }

        tabView.activate(tab);
    },

    photoList: function() {
        this.ensureTab('photo');

        if (!photoListView) {
            photoListView = new PhotoListView();
            photoListView.$el.appendTo($(".content"));
        } else {
            photoListView.show();
        }
    },

    photo: function(id) {
        if (!this.imageView) {
            this.imageView = new ImageView();
            this.imageView.$el.appendTo($(".content"));
        }

        console.log('set image id');
        this.imageView.setImage(id);
        console.log('fadeIn');
        this.imageView.fadeIn();

        this.imageView.on('exit', _.bind(function() {
            this.imageView.fadeOut(_.bind(function() {
                this.imageView.destroy();
                this.imageView = null;
            }, this));

            Backbone.history.navigate("/photo", {
                replace: 'replaceState',
                trigger: true
            });
        }, this));
    },

    video: function(id) {
        this.ensureTab('video');
        if (!photoListView) {
            videoListView = new VideoListView();
            videoListView.$el.appendTo($(".content"));
        } else {
            videoListView.show();
        }
        //if (photoListView) {
        //    photoListView.hide();
        //}
    },

    news: function() {
        this.ensureTab('news');
        newsView = new newsView();
        newsView.$el.appendTo($(".content"));
        //if (photoListView) {
        //    photoListView.hide();
        //}
    }
});

$(function() {
    $content = $(".content");

    new FansRouter();
    Backbone.history.start({
        pushState: true
    });
});
