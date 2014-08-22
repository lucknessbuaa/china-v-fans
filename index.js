var multiline = require("multiline");
var _ = require("underscore");
var Backbone = require("backbone");
var $ = require("jquery");
var jQuery = $;
require('./components/bootstrap/dist/js/bootstrap.js');

Backbone.$ = $;

var CONTENT_ID = 1;

function getPhotos(offset, limit) {
    return $.get("/API/output/image/?format=json&content=" + CONTENT_ID);
}

var TabView = Backbone.View.extend({
    initialize: function(options) {
        var tpl = _.template(multiline(function() {
            /*@preserve
            <ul class="nav nav-tabs" role="tablist">
                <li class="active"><a href="photo">正宗V海报</a></li>
                <li><a href="video">正宗V视频</a></li>
                <li><a href="news">正宗V资讯</a></li>
            </ul> 
             */
            console.log
        }).trim());

        this.setElement($(tpl())[0]);

        var self = this;

        this.$el.on('click', 'a', function() {
            var $this = $(this);
            var tab = $this.attr('href');
            self.activate(tab);
        });
    },

    activate: function(tab) {
        this.$el.children().removeClass('active');
        this.$el.find(['href=' + tab]).parent().addClass('active');
        Backbone.history.navigate(tab);
    }
});

var tabView = new TabView;

var FansRouter = Backbone.Router.extend({

    routes: {
        "photo/(:id)": "photo",
        "video": "video",
        "news": "news"
    },

    photo: function(id) {
        if (!id) {
            getPhotos(0, 20).then(function() {

            }, function() {

            });
        }
    },

    video: function(id) {

    },

    news: function() {

    }
});

$(function() {
    tabView.$el.appendTo(document.body);
    
    new FansRouter();
    Backbone.history.start();
});