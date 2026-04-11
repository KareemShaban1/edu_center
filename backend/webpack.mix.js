const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

 mix.js('resources/js/app.js', 'public/js')
 .sass('resources/sass/app.scss', 'public/css')
 .webpackConfig({
     module: {
         rules: [
             {
                 test: /\.m?js$/,
                 exclude: /(node_modules\/(?!@firebase))/,
                 use: {
                     loader: 'babel-loader',
                     options: {
                         presets: ['@babel/preset-env']
                     }
                 }
             }
         ]
     }
 });
