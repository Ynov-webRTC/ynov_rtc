'use strict';

const gulp = require('gulp');
const cleanCss = require('gulp-clean-css');
const concatCss = require('gulp-concat-css');
const gulpRename = require('gulp-rename');
const urlCss = 'public/css/';

gulp.task('concat-css', function() {
	return gulp.src(urlCss+'*.css')
		.pipe(concatCss('style.css'))
		.pipe(gulp.dest(urlCss));
});

gulp.task('css', ['concat-css'], function() {
	return gulp.src(urlCss+'style.css')
		.pipe(cleanCss())
		.pipe(gulpRename('style.min.css'))
		.pipe(gulp.dest(urlCss));
});

gulp.task('watch', function () {
	gulp.watch(urlCss+'*.css', ['css']);
});