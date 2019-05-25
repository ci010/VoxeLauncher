const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

// const BabiliWebpackPlugin = require('babili-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const { dependencies } = require('../package.json');

/**
 * List of node_modules to include in webpack bundle
 *
 * Required for specific packages like Vue UI libraries
 * that provide pure *.vue files that need compiling
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals
 */
const whiteListedModules = ['vue', 'vuetify'];

const rendererConfig = {
    mode: process.env.NODE_ENV,
    devtool: '#cheap-module-eval-source-map',
    entry: {
        renderer: path.join(__dirname, '../src/renderer/windows/main/index.js'),
        logger: path.join(__dirname, '../src/renderer/windows/logger/index.js'),
    },
    externals: [
        ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d)),
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['vue-style-loader', 'css-loader'],
            },
            {
                test: /\.vue$/,
                use: {
                    loader: 'vue-loader',
                    options: {
                        extractCSS: process.env.NODE_ENV === 'production',
                        loaders: {
                            sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax=1',
                            scss: 'vue-style-loader!css-loader!sass-loader',
                        },
                    },
                },
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                use: {
                    loader: 'url-loader',
                    query: {
                        limit: 10000,
                        name: 'imgs/[name].[ext]',
                    },
                },
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                use: {
                    loader: 'url-loader',
                    query: {
                        limit: 10000,
                        name: 'fonts/[name].[ext]',
                    },
                },
            },
        ],
    },
    node: {
        __dirname: process.env.NODE_ENV !== 'production',
        __filename: process.env.NODE_ENV !== 'production',
    },
    plugins: [
        new VueLoaderPlugin(),
        new MiniCssExtractPlugin({ filename: 'styles.css' }),
        new HtmlWebpackPlugin({
            filename: 'main.html',
            chunks: ['renderer'],
            template: path.resolve(__dirname, '../src/index.ejs'),
            minify: {
                collapseWhitespace: true,
                removeAttributeQuotes: true,
                removeComments: true,
            },
            nodeModules: process.env.NODE_ENV !== 'production'
                ? path.resolve(__dirname, '../node_modules')
                : false,
        }),
        new HtmlWebpackPlugin({
            filename: 'logger.html',
            chunks: ['logger'],
            template: path.resolve(__dirname, '../src/index.ejs'),
            minify: {
                collapseWhitespace: true,
                removeAttributeQuotes: true,
                removeComments: true,
            },
            nodeModules: process.env.NODE_ENV !== 'production'
                ? path.resolve(__dirname, '../node_modules')
                : false,
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
    ],
    output: {
        filename: '[name].js',
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, '../dist/electron'),
    },
    resolve: {
        alias: {
            '@': path.join(__dirname, '../src/renderer'),
            renderer: path.join(__dirname, '../src/renderer'),
            vue$: 'vue/dist/vue.esm.js',
            static: path.join(__dirname, '../static'),
            universal: path.join(__dirname, '../src/universal'),
        },
        extensions: ['.js', '.vue', '.json', '.css', '.node'],
    },
    target: 'electron-renderer',
};


/**
 * Adjust rendererConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
    rendererConfig.plugins.push(
        new webpack.DefinePlugin({
            __static: `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`,
        }),
    );
}

/**
 * Adjust rendererConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
    rendererConfig.devtool = '';

    rendererConfig.plugins.push(
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, '../static'),
                to: path.join(__dirname, '../dist/electron/static'),
                ignore: ['.*'],
            },
        ]),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"',
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true,
        }),
    );
}

module.exports = rendererConfig;
