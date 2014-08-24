var multiline = require("multiline");
var _ = require("underscore");
var Backbone = require("backbone");
var $ = require("jquery");
var jQuery = $;

Backbone.$ = $;

var CONTENT_ID = 1;

function getPhotoList(offset, limit) {
    return $.get("/API/output/image/?format=json&content=" + CONTENT_ID);
}

function getPhoto(id) {
    return $.get("/API/output/image/" + id + "?format=json&content=");
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
    },

    setImage: function(id) {
        getPhoto(id).then(_.bind(function(data) {
            this.$wrapper.html("");
            $("<img src='" + data.image + "'>").appendTo(this.$wrapper);
        }, this));
    },

    show: function() {
        this.$el.show();
    },

    hide: function() {
        this.$el.hide();
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

var tabView = new TabView;
var photoListView;

var FansRouter = Backbone.Router.extend({

    routes: {
        "photo(/:id)": "photo",
        "video": "video",
        "news": "news"
    },

    ensureTab: function(tab) {
        if (tabView.getActiveTab() !== tab) {
            tabView.activate(tab);
        }
    },

    photo: function(id) {
        this.ensureTab('photo');

        if (id) {
            if (!this.imageView) {
                this.imageView = new ImageView();
                this.imageView.$el.appendTo($(".content"));
            }

            this.imageView.setImage(id);
            this.imageView.show();
            this.imageView.on('exit', _.bind(function() {
                this.imageView.hide();
            }, this));
        } else {
            if (!photoListView) {
                photoListView = new PhotoListView();
                photoListView.$el.appendTo($(".content"));
            } else {
                photoListView.show();
            }
        }
    },

    video: function(id) {
        this.ensureTab('video');
    },

    news: function() {
        this.ensureTab('news');
    }
});

$(function() {
    tabView.$el.appendTo($(".content"));

    new FansRouter();
    Backbone.history.start({
        pushState: true
    });
});
