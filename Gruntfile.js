'use strict';

module.exports = function(grunt) {
    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: {
                src: ['Gruntfile.js', 'server.js', 'public/js/**'],
                options: {
                    jshintrc: true
                }
            }
        },
        watch: {
            js: {
                files: ['Gruntfile.js', 'server.js', 'public/js/**',],
                tasks: ['jshint'],
                options: {
                    livereload: true,
                    spawn: false
                },
            },
            html: {
                files: ['public/canvas.html'],
                options: {
                    livereload: true,
                },
            }
        },
        nodemon: {
          dev: {
            script: 'server.js',
            options: {
              args: [],
              nodeArgs: ['--debug'],
              env: {
                PORT: '3000'
              },
              cwd: __dirname,
              ignore: ['node_modules/**', 'public/**'],
              ext: 'js,coffee',
              watch: ['server'],
              legacyWatch: true
            }
          },
        },
        concurrent: {
            tasks: ['nodemon', 'watch'],
            options: {
                logConcurrentOutput: true
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-concurrent');

    grunt.option('force', true);

    grunt.registerTask('default', ['jshint', 'concurrent']);
};
