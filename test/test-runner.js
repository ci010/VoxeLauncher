const webpack = require('webpack');
const path = require('path');
// const BabiliWebpackPlugin = require('babili-webpack-plugin');

const { dependencies } = require('../package.json');


process.env.NODE_ENV = 'development';

/**
 * @type { import('webpack').Configuration }
 */
const config = {
    entry: {
        unit: path.join(__dirname, './unit/index'),
    },
    externals: [
        ...Object.keys(dependencies || {}),
    ],
    mode: process.env.NODE_ENV,
    module: {
        rules: [
            // {
            //     test: /\.js$/,
            //     use: {
            //         loader: 'babel-loader',
            //         options: {
            //             sourceMaps: 'inline',
            //             presets: [
            //                 ['stage-0'],
            //             ],
            //         },
            //     },
            //     exclude: /node_modules/,

            // },
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
        filename: 'unit.js',
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, '../dist/test'),
    },
    resolve: {
        alias: {
            locales: path.join(__dirname, '../locales'),
            static: path.join(__dirname, '../static'),
        },
        extensions: ['.js', '.json', '.node'],
    },
    target: 'node',
};


webpack(config).run((err, status) => {
    if (err) {
        console.error(err);
    } else {
        console.log(status.toString());
    }
});
