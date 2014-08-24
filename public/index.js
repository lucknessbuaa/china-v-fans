var multiline = require("multiline");
var _ = require("underscore");
var $ = require("jquery");
var Backbone = require("backbone");
Backbone.$ = $;

var download = require("multi-download");
var Velocity = require("./components/Velocity/velocity.js");

var CONTENT_ID = 1;

function mark(id) {

}

function unmark(id) {

}

function getPhotoList(offset, limit) {
    return $.get("/API/output/image/?format=json&content=" + CONTENT_ID);
}

function getPhoto(id) {
    return $.get("/API/output/image/" + id + "/?format=json&content=");
}

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

            Velocity(this.$heart[0], {
                'font-size': 24,
                'padding-top': 8
            }, {
                'duration': 200
            });

            Velocity(this.$heart[0], "reverse", {
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
        Velocity(this.$el[0], "fadeIn");
    },

    fadeOut: function(callback) {
        Velocity(this.$el[0], "fadeOut", {
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

var PhotoListView = Backbone.View.extend({
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

        this.photoList = [];
        getPhotoList(0, 20).then(_.bind(function(data) {
            this.photoList = data.objects;
            this.render();
        }, this));
    },

    show: function() {
        this.$el.show();
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
    },

    activate: function(tab) {
        this.$el.children().removeClass('active');
        this.$el.find('[href=' + tab + ']').parent().addClass('active');
        Backbone.history.navigate(tab, {
            replace: 'replaceState'
        });
    },

    getActiveTab: function() {
        var $link = this.$el.find('li.active').children('a');
        return $link.length > 0 ? $link.attr('href') : '';
    }
});

var $content, tabView, photoListView;

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
            tabView.$el.appendTo($content);
        }

        if (tabView.getActiveTab() !== tab) {
            tabView.activate(tab);
        }
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
    },

    news: function() {
        this.ensureTab('news');
    }
});

$(function() {
    $content = $(".content");

    new FansRouter();
    Backbone.history.start({
        pushState: true
    });
});