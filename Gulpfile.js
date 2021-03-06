var gulp = require('gulp');
var util = require('gulp-util');
var changed = require('gulp-changed');
var imagemin = require('gulp-imagemin');
var nodemon = require('gulp-nodemon');
var tinypng = require('gulp-tinypng');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var base64 = require('gulp-base64');
var browserify = require('browserify');
var source = require('vinyl-source-stream')
var stringify = require('stringify');

try {
    var notify = require('display-notification');
} catch (e) {
    var notify = function() {};
}

function onError(fn) {
    return function(err) {
        util.log(err);
        notify({
            title: 'Error',
            subtitle: 'fail to compiling scripts',
            text: err,
            sound: 'Bottle'
        });

        if (fn) {
            fn.call(err);
        }
    }
}

gulp.task('browserify', function() {
    var bundle = browserify('./public/index.js')
        .transform(stringify(['.html']))
        .transform('browserify-shim');

    var stream = bundle.bundle();
    return stream.on('error', onError(function(err) {
            stream.end();
        }))
        .pipe(source('index.js'))
        .pipe(gulp.dest('./public/build'))
        .on('end', function() {
            notify({
                'title': 'browserify',
                'subtitle': 'finish compiling scripts'
            });
        });
});
gulp.task('browserifyNews', function() {
    var bundle = browserify('./public/news.js')
        .transform(stringify(['.html']))
        .transform('browserify-shim');

    var stream = bundle.bundle();
    return stream.on('error', onError(function(err) {
            stream.end();
        }))
        .pipe(source('news.js'))
        .pipe(gulp.dest('./public/build'))
        .on('end', function() {
            notify({
                'title': 'browserify',
                'subtitle': 'finish compiling scripts'
            });
        });
});

gulp.task('scripts', ['browserify'], function() {
    return gulp.src([
            './public/components/jquery/dist/jquery.js',
            './public/components/velocity/jquery.velocity.js',
            './public/components/alertify.js/lib/alertify.js',
            './public/build/index.js'
        ]).pipe(concat('index.js'))
        // .pipe(uglify({
        //     preserveComments: 'some'
        // }))
        .pipe(gulp.dest('public/build'));
});

gulp.task('news', ['browserifyNews'], function() {
    return gulp.src([
            './public/components/jquery/dist/jquery.js',
            './public/components/velocity/jquery.velocity.js',
            './public/components/alertify.js/lib/alertify.js',
            './public/build/news.js'
        ]).pipe(concat('news.js'))
        // .pipe(uglify({
        //     preserveComments: 'some'
        // }))
        .pipe(gulp.dest('public/build'));
});

gulp.task('browserifyWelfare', function() {
    var bundle = browserify('./public/welfare.js')
        .transform(stringify(['.html']))
        .transform('browserify-shim');

    var stream = bundle.bundle();
    return stream.on('error', onError(function(err) {
            stream.end();
        }))
        .pipe(source('welfare.js'))
        .pipe(gulp.dest('./public/build'))
        .on('end', function() {
            notify({
                'title': 'browserify',
                'subtitle': 'finish compiling scripts'
            });
        });
});

gulp.task('welfare', ['browserifyWelfare'], function() {
    return gulp.src([
            './public/components/jquery/dist/jquery.js',
            './public/components/velocity/jquery.velocity.js',
            './public/components/alertify.js/lib/alertify.js',
            './public/build/welfare.js'
        ]).pipe(concat('welfare.js'))
        // .pipe(uglify({
        //     preserveComments: 'some'
        // }))
        .pipe(gulp.dest('public/build'));
});

gulp.task('browserifyPrize', function() {
    var bundle = browserify('./public/prize.js')
        .transform(stringify(['.html']))
        .transform('browserify-shim');

    var stream = bundle.bundle();
    return stream.on('error', onError(function(err) {
            stream.end();
        }))
        .pipe(source('prize.js'))
        .pipe(gulp.dest('./public/build'))
        .on('end', function() {
            notify({
                'title': 'browserify',
                'subtitle': 'finish compiling scripts'
            });
        });
});

gulp.task('prize', ['browserifyPrize'], function() {
    return gulp.src([
            './public/components/jquery/dist/jquery.js',
            './public/components/velocity/jquery.velocity.js',
            './public/components/alertify.js/lib/alertify.js',
            './public/build/prize.js'
        ]).pipe(concat('prize.js'))
        // .pipe(uglify({
        //     preserveComments: 'some'
        // }))
        .pipe(gulp.dest('public/build'));
});

gulp.task('browserifyFavor', function() {
    var bundle = browserify('./public/favor.js')
        .transform(stringify(['.html']))
        .transform('browserify-shim');

    var stream = bundle.bundle();
    return stream.on('error', onError(function(err) {
            stream.end();
        }))
        .pipe(source('favor.js'))
        .pipe(gulp.dest('./public/build'))
        .on('end', function() {
            notify({
                'title': 'browserify',
                'subtitle': 'finish compiling scripts'
            });
        });
});

gulp.task('favor', ['browserifyFavor'], function() {
    return gulp.src([
            './public/components/jquery/dist/jquery.js',
            './public/components/velocity/jquery.velocity.js',
            './public/components/alertify.js/lib/alertify.js',
            './public/build/favor.js'
        ]).pipe(concat('favor.js'))
        // .pipe(uglify({
        //     preserveComments: 'some'
        // }))
        .pipe(gulp.dest('public/build'));
});

gulp.task('browserifyStudent', function() {
    var bundle = browserify('./public/student.js')
        .transform(stringify(['.html']))
        .transform('browserify-shim');

    var stream = bundle.bundle();
    return stream.on('error', onError(function(err) {
            stream.end();
        }))
        .pipe(source('student.js'))
        .pipe(gulp.dest('./public/build'))
        .on('end', function() {
            notify({
                'title': 'browserify',
                'subtitle': 'finish compiling scripts'
            });
        });
});

gulp.task('student', ['browserifyStudent'], function() {
    return gulp.src([
            './public/components/jquery/dist/jquery.js',
            './public/components/velocity/jquery.velocity.js',
            './public/components/alertify.js/lib/alertify.js',
            './public/build/student.js'
        ]).pipe(concat('student.js'))
        // .pipe(uglify({
        //     preserveComments: 'some'
        // }))
        .pipe(gulp.dest('public/build'));
});

gulp.task('sass', function() {
    return gulp.src("scss/*.scss")
        .pipe(sass({
            errLogToConsole: true
        }))
        .pipe(base64({
            baseDir: 'public/css',
            maxImageSize: 48 * 1024 // 48k
        }))
        .pipe(gulp.dest("public/css"));
});

gulp.task('image-png', function() {
    return gulp.src("images/*.png")
        .pipe(changed('public/img'))
        .pipe(tinypng('9kl3nT2f8qC-AaApBVXDeQt-37ArLMNs'))
        .on('error', console.error)
        .pipe(gulp.dest("public/img"));
});

gulp.task('image-other', function() {
    return gulp.src("images/*.{jpg,jpeg,gif}")
        .pipe(changed('public/img'))
        .pipe(imagemin({
            progressive: true
        }))
        .pipe(gulp.dest("public/img"));
});

gulp.task("watch-scripts", function() {
    gulp.watch(["public/*.js", "package.json"], ["scripts"]);
});

gulp.task("watch-images", function() {
    gulp.watch("images/*", ["image-png", "image-other"]);
});

gulp.task("watch-sass", function() {
    gulp.watch(["scss/*", "img/*"], ["sass"]);
});

gulp.task("watch", ["watch-sass", "watch-images", "watch-scripts"]);



gulp.task('develop', ["watch"], function() {
    nodemon({
        script: 'app.js',
        ext: 'html js',
        ignore: ['public/**/*']
    }).on('restart', function() {
        console.log('restarted!')
    })
});
