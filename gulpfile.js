const gulp = require('gulp'),
    del = require('del'),
    async = require('async'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cleanCSS = require('gulp-clean-css'),
    htmlmin = require('gulp-htmlmin'),
    imagemin = require('gulp-imagemin'),
    iconfont = require('gulp-iconfont'),
    consolidate = require('gulp-consolidate'),
    svgo = require('gulp-svgo'),
    runTimestamp = Math.round(Date.now() / 1000),
    browserSync = require('browser-sync').create();

//Remove dist folder
gulp.task('clean', done => {
    del.sync('dist', { force: true });
    done();
});

// SASS
gulp.task('styles:sass', () => {
    return gulp.src('./src/styles/index.scss')
        .pipe(sass.sync())
        .pipe(gulp.dest('./dist/styles'))
        .pipe(browserSync.stream());
})

//Copy css files (libs, etc...)
gulp.task('styles:copy', () => {
    return gulp.src('./src/styles/vendor/*.css')
        .pipe(gulp.dest('./dist/styles'))
})

//Autoprefixer
gulp.task('styles:autoprefixer', () => {
    return gulp.src('./dist/styles/*.css')
        .pipe(autoprefixer({ browsers: ['last 2 versions'] }))
        .pipe(gulp.dest('./dist/styles'))
})

//Minify styles
gulp.task('styles:minify', () => {
    return gulp.src('./dist/styles/*.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('./dist/styles'))
})

//Minify html
gulp.task('html:minify', () => {
    return gulp.src('./src/*.html')
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('./dist'))
})

//Minify images
gulp.task('img:minify', () =>
    gulp.src('./src/img/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./dist/img'))
);

//Icon font
gulp.task('iconfont', done => {
    const iconStream = gulp
        .src(['./src/icons/*.svg'])
        .pipe(
            svgo({
                plugins: [
                    {
                        cleanupIDs: false
                    },
                    {
                        removeElementsByAttr: { id: ['Rectangle'] }
                    },
                    {
                        removeUselessStrokeAndFill: true
                    }
                ]
            })
        )
        .pipe(
            iconfont({
                fontName: 'icons', // required
                formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'], // default, 'woff2' and 'svg' are available
                prependUnicode: false,
                normalize: true,
                fontHeight: 1000,
                timestamp: runTimestamp // recommended to get consistent builds when watching files
            })
        );

    return async.parallel(
        [
            cb => {
                iconStream.on('glyphs', glyphs => {
                    gulp
                        .src('./src/templates/_icons.scss')
                        .pipe(
                            consolidate('lodash', {
                                glyphs,
                                fontName: 'icons',
                                fontPath: '../fonts/',
                                className: 'icon',
                                formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'] // default, 'woff2' and 'svg' are available
                            })
                        )
                        .pipe(gulp.dest('./src/styles/'))
                        .on('finish', cb);
                });
            },
            cb => {
                iconStream.pipe(gulp.dest('./src/fonts/')).on('finish', cb);
            }
        ],
        done
    );
});

//Fonts
gulp.task('fonts', done => {
    gulp.src('./src/fonts/**/*')
        .pipe(gulp.dest('./dist/fonts'))
    done();
})

gulp.task('build', gulp.series(
    'clean',
    'styles:copy',
    'styles:sass',
    'styles:autoprefixer',
    'styles:minify',
    'html:minify',
    'img:minify',
    'fonts'
))

// Static Server + watching scss/html files
gulp.task('serve', gulp.series('build', () => {
    browserSync.init({ server: "./dist" });
    gulp.watch("./src/styles/*.scss", gulp.series('styles:sass'));
    gulp.watch("./src/img/*.*", gulp.series('img:minify'));
    gulp.watch("./src/*.html", gulp.series('html:minify')).on('change', browserSync.reload);
}));