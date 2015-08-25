/*global module:false*/
module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
    '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
    '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
    '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
    ' Licensed <%= pkg.license %> */\n',
    // Task configuration.

    watch: {
      ts: {
        files: ['src/**.ts', 'demo/**.ts'],
        tasks: ['compile']
      },
      sass: {
        files: ['src/**.scss', 'demo/**.scss'],
        tasks: ['sass:dev']
      }
    },

    sass: {
      dist: {                            // target
        files: [{
          expand: true,
          src: ['src/**.scss'],
          dest: 'dist',
          flatten: true,
          ext: '.css'
        }, {
          expand: true,
          src: ['demo/**/*.scss'],
          dest: '',
          ext: '.css'
        }]
      },
      dev: {                              // another target
        options: {                      // dictionary of render options
          sourceMap: true
        },
        files: [{
          expand: true,
          src: ['src/**.scss'],
          dest: 'dist',
          flatten: true,
          ext: '.css'
        }, {
          expand: true,
          src: ['demo/**/*.scss'],
          dest: '',
          ext: '.css'
        }]
      }
    },

    browserify: {
      dist: {
        src: ['src/*.js'],
        dest: 'dist/<%= pkg.name %>.js',
        banner: '<%=banner%>'
        // Note: The entire `browserify-shim` config is inside `package.json`.
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= browserify.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    clean: ['doc', 'dist'],
    tslint: {
      options: {
        configuration: grunt.file.readJSON('tslint.json')
      },
      all: {
        src: ['src/**.ts', 'demo/**.ts']
      }
    },
    ts: {
      // A specific target
      dev: {
        // The source TypeScript files, http://gruntjs.com/configuring-tasks#files
        src: ['src/**.ts', 'demo/**.ts'],
        // If specified, generate this file that to can use for reference management
        reference: 'tsd.gen.d.ts',
        // If specified, the generate JavaScript files are placed here. Only works if out is not specified
        //outDir: 'test/outputdirectory',
        // If specified, watches this directory for changes, and re-runs the current target
        //watch: '<%= yeoman.app %>/scripts',
        // Use to override the default options, http://gruntjs.com/configuring-tasks#options
        options: {
          target: 'es5',
          module: 'commonjs', // 'amd' (default) | 'commonjs'
          sourceMap: true,
          declaration: false,
          removeComments: false
        }
      },
      // A specific target
      dist: {
        src: ['src/**.ts', 'demo/**.ts'],
        reference: 'tsd.gen.d.ts',
        options: {
          target: 'es5',
          module: 'commonjs', // 'amd' (default) | 'commonjs'
          sourceMap: false,
          declaration: false,
          removeComments: true
        }
      }
    },

    tsd: {
      reinstall: {
        options: {
          // execute a command
          command: 'reinstall',

          //optional: always get from HEAD
          latest: false,

          // specify config file
          config: 'tsd.json',

          // experimental: options to pass to tsd.API
          opts: {
            // props from tsd.Options
          }
        }
      }
    }
  });

  // show elapsed time at the end
  require('time-grunt')(grunt);

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // Default task.
  grunt.registerTask('watch', ['ts:dev', 'sass:dev', 'watch']);
  grunt.registerTask('compile', ['ts:dev', 'browserify']);
  grunt.registerTask('default', ['clean', 'tsd:reinstall', 'ts:dist', 'sass:dist', 'tslint', 'browserify', 'concat', 'uglify']);

};
