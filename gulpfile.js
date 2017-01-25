"use strict";

const gulp = require('gulp');

// Include plugins
const plugins = require('gulp-load-plugins')(); // tous les plugins de package.json

// Variables de chemins
const source = './public/'; // dossier de travail

// Tâche "css" = autoprefixer + CSScomb + beautify + minify
gulp.task('css', function () {
	return gulp.src(source + 'css/_*.css')
		.pipe(plugins.concatCss('style.css'))
		.pipe(plugins.csscomb())
		.pipe(plugins.cssbeautify({indent: '  '}))
		.pipe(gulp.dest(source + 'css/'))
		.pipe(plugins.rename({suffix: '.min'}))
		.pipe(plugins.csso())
		.pipe(gulp.dest(source + 'css/'));
});

// Watch Files For Changes
gulp.task('watch', function () {
	gulp.watch(source+'css/_*.css', ['css']);
});

// Tasks
gulp.task('default', ['css']);