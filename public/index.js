var multiline = require("multiline");
var _ = require("underscore");
var multpl = require('multpl');
var sizing = require('image-sizing');
var fs = require('fs');

var $ = require("jquery");
var Backbone = require("backbone");
Backbone.$ = $;
require("velocity");
var Spinner = require("./components/spin.js/spin");

var CONTENT_ID = 1;

function getVideoList(offset, limit) {
    return $.get("/contents/API/output/video/?format=json&content=" + CONTENT_ID);
}

function getPhotoList(offset, limit) {
    return $.get("/contents/API/output/image/?format=json&content=" + CONTENT_ID);
}

function getNewsList(offset, limit) {
    return $.get("/contents/API/output/article/?format=json&content=" + CONTENT_ID);
}

function getPhoto(id) {
    return $.get("/contents/API/output/image/" + id + "/?format=json&content=");
}

function postPhoto(id) {
    var request = $.get("/contents/API/likes", {
        option_id: id
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

var ImageView = Backbone.View.extend({
    initialize: function(options) {
        var tpl = _.template(multiline(function() {
            /*@preserve
            <div class='photo-view'>
                <div class="share-hide bg">
                    <img src="../img/arrow.png">
                </div>
                <div class='photo-wrapper'>
                </div>
                <div class='toolbar'>
                    <div class="length"></div>
                    <div class='share'><span class='glyphicon glyphicon-share'></span></div>
                    <div class='heart'><span class='glyphicon glyphicon-heart'></span></div>
                    <a class="download" href="#" target="_black"><span class='glyphicon glyphicon-download-alt'></span></a></div>
                <div>
            </div>
            */
            console.log
        }).trim());

        this.imgOptions = {};

        this.setElement($(tpl(options))[0]);
        this.$wrapper = this.$el.find('.photo-wrapper')

        this.spinner = new Spinner({
            color: '#fff',
            lines: 12
        });
        this.spinner.spin(this.$wrapper[0]);
        this.$share = this.$el.find('.share');
        this.$heart = this.$el.find('.heart');
        this.$download = this.$el.find('.download');
        this.$shareHide = this.$el.find('.share-hide');
        this.$shareImg = this.$el.find('.share-hide img');

        this.$shareHide.click(_.bind(function() {
            this.$shareImg.velocity("fadeOut")
            this.$shareHide.addClass('share-hide');
            this.$el.find('.toolbar').removeClass('share-hide');
        }, this));

        this.$share.click(_.bind(function() {
            this.$shareHide.removeClass('share-hide');
            this.$el.find('.toolbar').addClass('share-hide');
            this.$shareImg.velocity("fadeIn")
        }, this));

        this.$heart.click(_.bind(function() {
            if (!this.$heart.hasClass('up')) {
                this.$heart.addClass('up');
                this.markImage(this.imageId);
                postPhoto(this.imageId);
            } else {
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
            this.image = new Image();
            this.image.src = data.image;

            this.imgOptions.imgUrl = data.image;
            this.imgOptions.title = data.name;

            this.$download.attr('href', data.image);

            this.$image = $(this.image);

            this.$image.load(_.bind(function() {
                this.onImageLoad();
            }, this));
        }, this));
    },



    onImageLoad: function() {
        var imgWidth = this.$image[0].naturalWidth;
        var imgHeight = this.$image[0].naturalHeight;

        var wrapperWidth = window.innerWidth;
        var wrapperHeight = window.innerHeight;

        console.log(imgWidth, imgHeight, wrapperWidth, wrapperHeight);
        this.$wrapper.scrollTop(-(wrapperHeight - imgHeight) / 2);
        if (imgWidth / imgHeight > wrapperWidth / wrapperHeight) {
            var width = imgWidth * wrapperHeight / imgHeight;
            this.$image.height(wrapperHeight);
            this.$image.appendTo(this.$wrapper);
            this.$wrapper.scrollLeft(-(wrapperWidth - width) / 2);
        } else {
            this.$image.width(wrapperWidth);
            this.$image.appendTo(this.$wrapper);
            this.$wrapper.scrollTop(0);
        }
        this.spinner.stop();
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
        var tpl = _.template(require("./tpl/VideoItem.html").trim());
        this.setElement($(tpl(options).trim()));

        this.$wrapper = this.$el.find('.cover');
        this.$image = this.$el.find('img.image');
        this.spinner = new Spinner({
            color: '#fff',
            lines: 12
        });
        this.spinner.spin(this.$wrapper[0]);
        this.resize = false;
        this.width = window.innerWidth - 40;
        this.height = 150;
        this.$image.load(_.bind(function() {
            this.ensureSize();
            this.spinner.stop();
        }, this));
        this.$image.error(_.bind(function(){
            this.spinner.stop();
        }, this));
    },

    ensureSize: function() {
        if (this.$image[0].naturalWidth == 0 || this.resize) {
            return;
        }
        this.resize = true;
        console.log('resizing image', this.width, this.height, this.$image[0].naturalWidth, this.$image[0].naturalHeight);
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

var VideoListView = BaseView.extend({
    initialize: function(options) {
        var tpl = multpl(function() {
            /*@preserve
            <div class='video-list-wrapper' id="load">
				<p class='tip'>暂无视频</p>
                <ul class='video-list list-unstyled'>
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
            getVideoList(0, 10000).then(_.bind(function(data) {
                if (data.objects.length === 0) {
                    return this.$el.addClass('empty');
                }

                this.$el.removeClass('empty');
                _.each(data.objects, _.bind(function(video) {
                    var item = new VideoItem(video);

                    this.itemlist.push(item);
                    item.$el.appendTo(this.$list);
                }, this));
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
                    'max-height': ($($temp.children()[0]).outerHeight() + 8) + 'px'
                });
                $(this).children()[0].innerHTML = '收起';
            } else {
                $temp.addClass('hi');
                $temp.velocity({
                    'max-height': '46px'
                });
                $(this).children()[0].innerHTML = '展开';
            }
        });
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
        this.$image.error(_.bind(function(){
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
                if(data.objects.length === 0){
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
            }, this)).always(_.bind(function(){
                this.spinner.stop();
            }, this));

        } else if(this.itemlist.length !== 0){
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

var PhotoListView = BaseView.extend({
    initialize: function(options) {
        var tpl = _.template(multiline(function() {
            /*@preserve
            <div class='photo-list-wrapper'>
                <p class="tip">暂无照片</p>
                <ul class='photo-list clearfix list-unstyled'>
                </ul>
            </div>
            */
            console.log
        }).trim());

        this.setElement($(tpl(options))[0]);
        this.$list = this.$el.find('.photo-list');

        this.photoList = [];
        if (this.photoList.length === 0) {
            this.spinner = new Spinner({
                color: '#fff',
                lines: 12
            });
            this.spinner.spin(this.$el[0]);
        }
        getPhotoList(0, 20).then(_.bind(function(data) {
            if(data.objects.length === 0){
                return this.$el.addClass('empty');
            }

            this.$el.removeClass('empty');
            this.photoList = data.objects;
            this.render();
        }, this), _.bind(function(){
            this.$el.children('p.tip').html('网络异常');
            this.$el.addClass('empty');
        }, this)).always(_.bind(function(){
            this.spinner.stop();
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

        this.$el.on('tap', function() {
            this.hide();
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
            tabView = new TabView()
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
        //this.imageView.fadeIn();

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
    },

    news: function() {
        this.ensureTab('news');
    }
});

$(function() {
    $content = $(".content");

    new FansRouter();
    Backbone.history.start({
        root: "/fans/",
        pushState: true
    });
});
