var gulp = require('gulp');
var changed = require('gulp-changed');
var imagemin = require('gulp-imagemin');
var tinypng = require('gulp-tinypng');
var sass = require('gulp-sass');
var base64 = require('gulp-base64');
var browserify = require('gulp-browserify');

gulp.task('scripts', function() {
    return gulp.src('index.js')
        .pipe(browserify({
            insertGlobals: true
        }))
        .pipe(gulp.dest('build'))
});

gulp.task('sass', function() {
    return gulp.src("scss/*.scss")
        .pipe(sass({
            errLogToConsole: true
        }))
        .pipe(base64({
            baseDir: 'css',
            maxImageSize: 48 * 1024 // 48k
        }))
        .pipe(gulp.dest("css"));
});

gulp.task('image-png', function() {
    return gulp.src("images/*.png")
        .pipe(changed('img'))
        .pipe(tinypng('9kl3nT2f8qC-AaApBVXDeQt-37ArLMNs'))
        .on('error', console.error)
        .pipe(gulp.dest("img"));
});

gulp.task('image-other', function() {
    return gulp.src("images/*.{jpg,jpeg,gif}")
        .pipe(changed('img'))
        .pipe(imagemin({
            progressive: true,
            use: [pngcrush()]
        }))
        .pipe(gulp.dest("img"));
});

gulp.task("watch-scripts", function() {
    gulp.watch("index.js", ["scripts"]);
});

gulp.task("watch-images", function() {
    gulp.watch("images/*", ["image-png", "image-other"]);
});

gulp.task("watch-sass", function() {
    gulp.watch(["scss/*", "img/*"], ["sass"]);
});

gulp.task("watch", ["watch-sass", "watch-images", "watch-scripts"]);
