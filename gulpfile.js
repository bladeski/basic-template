var gulp = require('gulp'),
    sourcemaps = require("gulp-sourcemaps"),
    concat = require("gulp-concat"),
    babel = require("gulp-babel"),
    run = require('gulp-run'),
    del = require('del'),
    install = require('gulp-install'),
    nodeModulePath = './node_modules/',
    libPath = './src/public/lib/';

gulp.task('clean', function () {
    return del(['src/public/lib/*']);
});

gulp.task('build', ['clean'], function () {
    var dependencies = [{
        name: 'Knockout.js',
        dir: 'knockout',
        paths: ['knockout/build/output/knockout-latest.js']
    }, {
        name: 'Babel Polyfill',
        dir: 'babel',
        paths: ['babel-polyfill/dist/polyfill.min*']
    }, {
        name: 'Bootstrap Material Design',
        dir: 'bootstrap-material-design',
        paths: ['bootstrap-material-design/dist/css/bootstrap-material-design.min*', 'bootstrap-material-design/dist/js/bootstrap-material-design.min*']
    }, {
        name: 'Bootstrap Material Design Icons CSS',
        dir: 'bootstrap-material-design/icons/css',
        paths: ['bootstrap-material-design-icons/css/material-icons.min*']
    }, {
        name: 'Bootstrap Material Design Icons Fonts',
        dir: 'bootstrap-material-design/icons/fonts',
        paths: ['bootstrap-material-design-icons/fonts/*']
    }, {
        name: 'Popper JS',
        dir: 'popper.js',
        paths: ['popper.js/dist/umd/popper.*']
    }, {
        name: 'Require JS',
        dir: 'requirejs',
        paths: ['requirejs/require.js']
    }, {
        name: 'jQuery',
        dir: 'jquery',
        paths: ['jquery/dist/jquery.min.js']
    }, {
        name: 'Perfect Scrollbar JS',
        dir: 'perfect-scrollbar/js',
        paths: ['perfect-scrollbar/dist/js/perfect-scrollbar.min.js']
    }, {
        name: 'Perfect Scrollbar CSS',
        dir: 'perfect-scrollbar/css',
        paths: ['perfect-scrollbar/dist/css/perfect-scrollbar.min.css']
    }, {
        name: 'Feather Icons JS',
        dir: 'feather-icons',
        paths: ['feather-icons/dist/feather.min.js']
    }, {
        name: 'Feather Icons Icons',
        dir: 'feather-icons/icons',
        paths: ['feather-icons/dist/icons/*.svg']
    }];

    dependencies.forEach(function (dep) {
        dep.paths.forEach(function (path) {
            return gulp.src(nodeModulePath + path)
                .pipe(gulp.dest(libPath + dep.dir));
        });
    });
    return gulp.src("src/scripts/*.js")
        .pipe(babel())
        .pipe(gulp.dest("src/public/scripts"));
});

gulp.task('run', ['build'], function () {
    return run('set DEBUG=app:* & npm start').exec();
});
