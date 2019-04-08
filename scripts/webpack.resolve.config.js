const path = require('path');

module.exports = {
    resolve: {
        alias: {
            vue$: 'vue/dist/vue.esm.js',
            static: path.join(__dirname, '../static'),
            universal: path.join(__dirname, '../src/universal'),
        },
        extensions: ['.js', '.vue', '.json', '.css', '.node'],
    },
};
