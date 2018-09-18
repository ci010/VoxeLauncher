

process.env.BABEL_ENV = 'renderer'

const path = require('path')
const fs = require('fs')
const { dependencies } = require('../package.json')
const webpack = require('webpack')

const BabiliWebpackPlugin = require('babili-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')

/**
 * List of node_modules to include in webpack bundle
 *
 * Required for specific packages like Vue UI libraries
 * that provide pure *.vue files that need compiling
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals
 */
const whiteListedModules = ['vue']

const themes = fs.readdirSync(path.join(__dirname, '..', 'src', 'renderer'))

function generate(theme) {
    const rendererConfig = {
        name: theme,
        devtool: '#cheap-module-eval-source-map',
        entry: {
            renderer: [`webpack-hot-middleware/client?name=${theme}`, path.join(__dirname, `../src/renderer/${theme}/main.js`)],
        },
        externals: [
            ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d)),
        ],
        module: {
            rules: [
                // {
                //     test: /\.css$/,
                //     use: ExtractTextPlugin.extract({
                //         fallback: 'style-loader',
                //         use: 'css-loader',
                //     }),
                // },
                {
                    test: /\.css$/,
                    use: ['vue-style-loader', 'css-loader']
                },
                {
                    test: /\.html$/,
                    use: 'vue-html-loader',
                },
                {
                    test: /\.js$/,
                    use: 'babel-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.node$/,
                    use: 'node-loader',
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
            // new ExtractTextPlugin(`${theme}.styles.css`),
            new MiniCssExtractPlugin(`${theme}.styles.css`),
            new HtmlWebpackPlugin({
                filename: `${theme}.html`,
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
            new webpack.ProvidePlugin({
                $: 'jquery',
                jquery: 'jquery',
                'window.jQuery': 'jquery',
                jQuery: 'jquery',
            }),
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NoEmitOnErrorsPlugin(),
        ],
        output: {
            filename: `${theme}.js`,
            libraryTarget: 'commonjs2',
            path: path.join(__dirname, '../dist/electron'),
        },
        resolve: {
            alias: {
                '@': path.join(__dirname, `../src/renderer/${theme}`),
                renderer: path.join(__dirname, '../src/renderer'),
                vue$: 'vue/dist/vue.esm.js',
                locales: path.join(__dirname, '../locales'),
                static: path.join(__dirname, '../static'),
                universal: path.join(__dirname, '../src/universal'),
                '@universal': path.join(__dirname, '../src/universal'),
            },
            extensions: ['.js', '.vue', '.json', '.css', '.node'],
        },
        target: 'electron-renderer',
    }

    /**
     * Adjust rendererConfig for development settings
     */
    if (process.env.NODE_ENV !== 'production') {
        rendererConfig.plugins.push(
            new webpack.DefinePlugin({
                __static: `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`,
            }),
        )
    }

    /**
     * Adjust rendererConfig for production settings
     */
    if (process.env.NODE_ENV === 'production') {
        rendererConfig.devtool = ''

        rendererConfig.plugins.push(
            new BabiliWebpackPlugin({
                // removeConsole: true,
                // removeDebugger: true,
            }),
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
        )
    }
    return rendererConfig
}

const allConfig = themes.map(generate);

module.exports = allConfig
