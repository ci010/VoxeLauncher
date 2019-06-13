const path = require('path');
const webpack = require('webpack');

const { dependencies } = require('../package.json');

const mainConfig = {
    mode: process.env.NODE_ENV,
    entry: {
        main: path.join(__dirname, '../src/main/index.js'),
    },
    externals: [
        ...Object.keys(dependencies || {}),
    ],
    module: {
        rules: [
            {
                test: /\.node$/,
                use: 'node-loader',
            },
        ],
    },
    node: {
        __dirname: process.env.NODE_ENV !== 'production',
        __filename: process.env.NODE_ENV !== 'production',
    },
    output: {
        filename: '[name].js',
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, '../dist/electron'),
    },
    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
    ],
    resolve: {
        extensions: ['.js', '.json', '.node'],
        alias: {
            main: path.join(__dirname, '../src/main'),
            static: path.join(__dirname, '../static'),
            universal: path.join(__dirname, '../src/universal'),
        },
    },
    target: 'electron-main',
};

/**
 * Adjust mainConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
    mainConfig.devtool = 'source-map';
    mainConfig.plugins.push(
        new webpack.DefinePlugin({
            __static: `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`,
        }),
    );
}

/**
 * Adjust mainConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
    mainConfig.plugins.push(
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"',
        }),
    );
}

module.exports = mainConfig;
