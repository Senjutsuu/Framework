var gulp = require('gulp'),
    gutil = require('gulp-util'),
    gulpif = require('gulp-if'),
    plumber = require('gulp-plumber'),
    rename = require('gulp-rename'),
    consolidate = require('gulp-consolidate'),
    concat = require('gulp-concat'),
    coffee = require('gulp-coffee'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    fontgen = require('gulp-fontgen'),
    iconfont = require('gulp-iconfont'),
    iconfontcss = require('gulp-iconfont-css'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    sourcemaps = require('gulp-sourcemaps'),
    gulpSequence = require('gulp-sequence').use(gulp),
    shell = require('gulp-shell'),
    livereload = require('gulp-livereload'),
    parseTwig = require('./gulp-helpers/parse-twig'),
    stripPath = require('./gulp-helpers/strip-path'),
    gulpWebpack = require('webpack-stream'),
    webpack = require('webpack');

var config = {
  assetsDir:    'web/assets'
};

var minify = true;

function showStatus(task, message, type) {
  message = '--> [' + task + '] ' + message;

  if (type === 'success') {
    message = gutil.colors.green(message);
  }
  else if (type === 'warning') {
    message = gutil.colors.yellow(message);
  }
  else if (type === 'error') {
    message = gutil.colors.red(message);
  }

  gutil.log(message);
}
function showError(error) {
  showStatus('ERROR', error.message, 'error');
}
function handleWatchEvent(event) {
  showStatus('watch', 'File ' + event.path.replace(__dirname, '.') + ' was ' + event.type + '.');
}

gulp.task('coffee', function() {
  return gulp.src(
      [
        './app/Resources/assets/coffee/***.coffee',
        './src/**/Resources/assets/coffee/***.coffee',
        './vendor/sumocoders/**/Resources/assets/coffee/***.coffee'
      ]
  )
      .pipe(plumber())
      .pipe(gulpif(minify == false, sourcemaps.init()))
      .pipe(coffee({}).on('error', gutil.log))
      .on('end', function() { showStatus('coffee', 'Coffee-files compiled', 'success')})
      .pipe(rename(function(path) {
        var end = path.dirname.indexOf('Bundle') + 6;
        var start = path.dirname.substr(0, end).lastIndexOf('/') + 1;
        var bundle = path.dirname.substr(start, end - start);

        path.dirname = '';
        path.basename = bundle.toLowerCase() + '.' + path.basename;
      }))
      .on('end', function() { showStatus('coffee', 'Coffee-files renamed', 'success')})
      .pipe(gulpif(minify == false, sourcemaps.write()))
      .pipe(gulp.dest(config.assetsDir + '/js'))
      .on('end', function() { showStatus('coffee', 'Coffee-files saved', 'success')})
      .pipe(livereload());
});

var commonWebpackConfig = {
  output: {
    filename: 'bundle.js'
  },
  module: {
    loaders: [{
      test: /.js?$/,
      loader: 'babel',
      exclude: /node_modules/
    }]
  }
};

gulp.task('webpack', function() {
  return gulp.src('./src/SumoCoders/FrameworkCoreBundle/Resources/assets/js/index.js')
    .pipe(plumber())
    .pipe(gulpWebpack(Object.assign({}, commonWebpackConfig, {
      watch: true,
    })))
    .pipe(gulp.dest(config.assetsDir + '/js'))
    .pipe(livereload());
});

gulp.task('webpack:build', function() {
  return gulp.src('./src/SumoCoders/FrameworkCoreBundle/Resources/assets/js/index.js')
    .pipe(gulpWebpack(Object.assign({}, commonWebpackConfig, {
      plugins: [
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: false
          }
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"production"'
        })
      ]
    })))
    .pipe(gulp.dest(config.assetsDir + '/js'));
});

gulp.task('js', function() {
  return gulp.src(
      [
        './app/Resources/assets/js/**',
        './src/**/Resources/assets/js/**',
        './vendor/sumocoders/**/Resources/assets/js/**'
      ]
  )
      .pipe(gulpif(minify == false, sourcemaps.init()))
      .pipe(rename(function(path) {
        if (path.extname === '') {
          path.dirname = '';
          path.basename = '';
          return;
        }

        path.dirname = stripPath('/js/', path.dirname);
      }))
      .on('end', function() { showStatus('js', 'JS-files renamed', 'success')})
      .pipe(gulpif(minify == false, sourcemaps.write()))
      .pipe(gulp.dest(config.assetsDir + '/js'))
      .on('end', function() { showStatus('js', 'JS-files saved', 'success')})
      .pipe(livereload());
});

gulp.task('js:concat', ['js', 'coffee'], function() {
  var action = function(grouped) {
    // loop trough all the collected js groups and concat them
    for (var destination in grouped) {
      gulp.src(grouped[destination])
        .pipe(concat(stripPath('/assets/js/', destination)))
        .pipe(uglify())
        .pipe(gulp.dest(config.assetsDir + '/js'));
    }
  }

  return gulp.src([
    './app/Resources/views/**/*.html.twig',
    './src/**/Resources/views/**/*.html.twig',
    '/vendor/sumocoders/**/Resources/views/**/*.html.twig',
  ])
    .pipe(parseTwig(action));
});

gulp.task('images', function() {
  return gulp.src(
      [
        './app/Resources/assets/images/**',
        './src/**/Resources/assets/images/**',
        './vendor/sumocoders/**/Resources/assets/images/**'
      ]
  )
      .pipe(rename(function(path) {
        if (path.extname === '') {
          path.dirname = '';
          path.basename = '';
          return;
        }

        path.dirname = stripPath('/images/', path.dirname);
      }))
      .on('end', function() { showStatus('images', 'image-files renamed', 'success')})
      .pipe(imagemin())
      .on('end', function() { showStatus('images', 'image-files minified', 'success')})
      .pipe(gulp.dest(config.assetsDir + '/images'))
      .on('end', function() { showStatus('images', 'image-files saved', 'success')})
      .pipe(livereload());
});

gulp.task('fonts', gulpSequence(
    'del:cleanup_useless_font_css',
    'fonts:generate'
));

gulp.task('fonts:generate', function() {
  return gulp.src(
      [
        './app/Resources/assets/fonts/**/*.ttf',
        './app/Resources/assets/fonts/**/*.otf',
        './src/**/Resources/assets/fonts/**/*.ttf',
        './src/**/Resources/assets/fonts/**/*.otf',
        './vendor/sumocoders/**/Resources/assets/fonts/**/*.ttf',
        './vendor/sumocoders/**/Resources/assets/fonts/**/*.otf'
      ]
  )
      .pipe(rename(function(path) {
        path.dirname = '';
      }))
      .on('end', function() { showStatus('fonts', 'font-files renamed', 'success')})
      .pipe(gulp.dest(config.assetsDir + '/fonts'))
      .on('end', function() { showStatus('fonts', 'font-files saved', 'success')})
      .pipe(fontgen({
        dest: config.assetsDir + '/fonts'
      }))
      .on('end', function() { showStatus('fonts', 'other formats generated', 'success')})
      .pipe(livereload());
});

gulp.task('del:cleanup_useless_font_css', shell.task('rm -rf ' + config.assetsDir + '/fonts/*.css'));

gulp.task('icons', function() {
  return gulp.src(
      [
        './app/Resources/assets/icon-font/**/*.svg',
        './src/**/Resources/assets/icon-font/**/*.svg',
        './vendor/sumocoders/**/Resources/assets/icon-font/**/*.svg',
      ]
  )
      .pipe(iconfont({
        fontName:   'icons',
      }))
      .on('glyphs', function(glyphs) {
        var options = {
          glyphs: glyphs,
          fontName: 'icons',
          fontPath: '../fonts/',
          className: 'icon'
        };

        gulp.src('./src/SumoCoders/FrameworkCoreBundle/Resources/assets/sass/base/_iconfont-template.scss')
          .pipe(consolidate('lodash', options))
          .pipe(rename({ basename: '_icons' }))
          .pipe(gulp.dest('./src/SumoCoders/FrameworkCoreBundle/Resources/assets/sass/'));
      })
      .pipe(gulp.dest(config.assetsDir + '/fonts'))
      .on('end', function() { showStatus('icons', 'icon-font generated', 'success')});
});

gulp.task('sass', ['sass:generate_css']);
gulp.task('sass:generate_css', ['icons'], function() {
  return gulp.src(
      [
        './app/Resources/assets/sass/**',
        './src/**/Resources/assets/sass/**',
        './vendor/sumocoders/**/Resources/assets/sass/**'
      ]
  )
      .pipe(gulpif(minify == false, sourcemaps.init()))
      .pipe(plumber())
      .pipe(sass({
        includePaths: [
          './node_modules/bootstrap-sass/assets/stylesheets',
          './web/assets/vendor'
        ],
        outputStyle: minify ? 'compressed' : 'expanded',
        precision: 10

      }).on('error', showError))
      .pipe(rename(function(path){ path.dirname = ''; }))
      .on('end', function() { showStatus('sass', 'SCSS-files compiled', 'success')})
      .pipe(autoprefixer({}))
      .on('end', function() { showStatus('sass', 'Added prefixes', 'success')})
      .pipe(gulpif(minify == false, sourcemaps.write()))
      .pipe(gulp.dest(config.assetsDir + '/css'))
      .on('end', function() { showStatus('sass', 'CSS-files generated', 'success')})
      .pipe(livereload());
});
gulp.task('sass:cleanup', ['sass'], shell.task([
    'rm src/SumoCoders/FrameworkCoreBundle/Resources/assets/sass/_icons.scss'
  ])
);

gulp.task('translations', ['translations:cleanup'], function() {
  return gulp.src(
      [
        './app/Resources/translations/**',
        './src/**/Resources/translations/**',
        './vendor/sumocoders/**/Resources/assets/translations/**'
      ]
  )
      .pipe(livereload());
});
gulp.task('translations:cleanup', shell.task([
    'rm -rf ./app/cache/dev/translations'
  ])
);

gulp.task('watch', [], function() {
  minify = false;

  livereload.listen();

  gulp.watch(
      [
        './app/Resources/assets/coffee/***.coffee',
        './src/**/Resources/assets/coffee/***.coffee',
        './vendor/sumocoders/**/Resources/assets/coffee/***.coffee'
      ],
      ['coffee']
  ).on('change', handleWatchEvent);

  gulp.watch(
      [
        './app/Resources/assets/js/**',
        './src/**/Resources/assets/js/**',
        './vendor/sumocoders/**/Resources/assets/js/**'
      ],
      ['webpack']
  ).on('change', handleWatchEvent);

  gulp.watch(
      [
        './app/Resources/views/**/*.html.twig',
        './src/**/Resources/views/**/*.html.twig',
        '/vendor/sumocoders/**/Resources/views/**/*.html.twig',
      ],
      ['js:concat']
  ).on('change', handleWatchEvent);

  gulp.watch(
      [
        './app/Resources/assets/images/**',
        './src/**/Resources/assets/images/**',
        './vendor/sumocoders/**/Resources/assets/images/**'
      ],
      ['images']
  ).on('change', handleWatchEvent);

  gulp.watch(
      [
        './app/Resources/assets/fonts/**/*.ttf',
        './app/Resources/assets/fonts/**/*.otf',
        './src/**/Resources/assets/fonts/**/*.ttf',
        './src/**/Resources/assets/fonts/**/*.otf',
        './vendor/sumocoders/**/Resources/assets/fonts/**/*.ttf',
        './vendor/sumocoders/**/Resources/assets/fonts/**/*.otf'
      ],
      ['fonts']
  ).on('change', handleWatchEvent);

  gulp.watch(
      [
        './app/Resources/assets/icon-font/**/*.svg',
        './src/**/Resources/assets/icon-font/**/*.svg',
        './vendor/sumocoders/**/Resources/assets/icon-font/**/*.svg',
        './app/Resources/assets/sass/**',
        './src/**/Resources/assets/sass/**',
        './vendor/sumocoders/**/Resources/assets/sass/**'
      ],
      ['sass','sass:cleanup']
  ).on('change', handleWatchEvent);
  gulp.watch(
      [
        './app/Resources/translations/**',
        './src/**/Resources/translations/**',
        './vendor/sumocoders/**/Resources/assets/translations/**'
      ],
      ['translations']
  ).on('change', handleWatchEvent);

});

// public tasks
gulp.task('default', function() {
  gulp.start('build');
});

gulp.task('build', function() {
  gulp.start('coffee', 'js', 'js:concat', 'webpack:build', 'images', 'fonts', 'sass', 'sass:cleanup');
});

gulp.task('serve', function() {
  gulp.start('watch');
});
