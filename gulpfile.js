var assign      = require('object-assign'),
    browserSync = require('browser-sync'),
    bump        = require('gulp-bump'),
    concat      = require('gulp-concat'),
    coveralls   = require('gulp-coveralls'),
    del         = require('del'),
    eslint      = require('gulp-eslint'),
    gulp        = require('gulp'),
    header      = require('gulp-header'),
    KarmaServer = require('karma').Server,
    rename      = require('gulp-rename'),
    sourcemaps  = require('gulp-sourcemaps'),
    uglify      = require('gulp-uglify'),
    umd         = require('gulp-umd');


/*=========================================================
  PATHS
---------------------------------------------------------*/
var paths = {
  manifests: ['./bower.json', './package.json'],
  src: 'src/**/*.js',
  target: 'dist',
  test: 'test/**/*.js',
  vendor: 'vendor'
};


/*=========================================================
  CONFIG
---------------------------------------------------------*/
var config = {
  browserSync: {
    browser: ['firefox developer edition'],
    files: [
      paths.src,
      paths.vendor,
      paths.examples + '/**/*'
    ],
    notify: false,
    port: 7000,
    reloadDelay: 200,
    server: {baseDir: '.'},
    startPath: paths.examples
  },

  build: {
    matchmedia: {
      src: paths.vendor + '/matchMedia/matchMedia*.js',
      outfile: 'match-media.js'
    }
  },

  bump: {
    minor: {type: 'minor'},
    patch: {type: 'patch'}
  },

  coveralls: {
    src: 'tmp/coverage/**/lcov.info'
  },

  eslint: {
    src: [paths.src, paths.test]
  },

  header: {
    src: paths.target + '/*.js',
    template: '/* <%= name %> v<%= version %> - <%= date %> - <%= url %> */\n'
  },

  karma: {
    configFile: __dirname + '/karma.conf.js'
  },

  uglify: {
    src: paths.target + '/*.js'
  },

  umd: {
    exports: function(){
      return 'Quartz';
    },
    namespace: function(){
      return 'Quartz';
    }
  }
};


/*=========================================================
  TASKS
---------------------------------------------------------*/
gulp.task('bump.minor', function(){
  return gulp
    .src(paths.manifests)
    .pipe(bump(config.bump.minor))
    .pipe(gulp.dest('.'));
});


gulp.task('bump.patch', function(){
  return gulp
    .src(paths.manifests)
    .pipe(bump(config.bump.patch))
    .pipe(gulp.dest('.'));
});


gulp.task('clean.target', function(){
  return del(paths.target);
});


gulp.task('coveralls', function(){
  return gulp
    .src(config.coveralls.src)
    .pipe(coveralls());
});


gulp.task('headers', function(){
  var pkg = require('./package.json');
  var headerContent = {date: (new Date()).toISOString(), name: pkg.name, version: pkg.version, url: pkg.homepage};

  return gulp
    .src(config.header.src)
    .pipe(header(config.header.template, headerContent))
    .pipe(gulp.dest(paths.target));
});


gulp.task('lint', function(){
  return gulp
    .src(config.eslint.src)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});


gulp.task('server', function(done){
  browserSync
    .create()
    .init(config.browserSync, done);
});


gulp.task('karma', function(done){
  var conf = assign({}, config.karma, {singleRun: true});
  var server = new KarmaServer(conf, function(error){
    if (error) process.exit(error);
    else done();
  });
  server.start();
});


gulp.task('karma.watch', function(done){
  var server = new KarmaServer(config.karma, function(error){
    if (error) process.exit(error);
    else done();
  });

  server.start();
});


gulp.task('test', gulp.series('lint', 'karma'));


gulp.task('test.watch', gulp.series('lint', 'karma.watch'));


gulp.task('uglify', function(){
  return gulp
    .src(config.uglify.src)
    .pipe(rename(function(path){
      path.basename += '.min';
    }))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('./', {includeContent: true}))
    .pipe(gulp.dest(paths.target));
});


gulp.task('umd', function(){
  return gulp
    .src(paths.src)
    .pipe(umd(config.umd))
    .pipe(gulp.dest(paths.target));
});


gulp.task('build.matchmedia', function(){
  return gulp
    .src(config.build.matchmedia.src)
    .pipe(concat(config.build.matchmedia.outfile))
    .pipe(gulp.dest(paths.target));
});


gulp.task('build', gulp.series(
  'test',
  'clean.target',
  'build.matchmedia',
  'umd',
  'uglify'
));


gulp.task('dist.minor', gulp.series(
  'build',
  'bump.minor',
  'headers'
));


gulp.task('dist.patch', gulp.series(
  'build',
  'bump.patch',
  'headers'
));
