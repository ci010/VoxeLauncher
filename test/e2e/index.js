/* eslint-disable import/first */
const Vue = require('vue');
const electron = require('electron');
const { Application } = require('spectron');

Vue.config.devtools = false;
Vue.config.productionTip = false;

afterEach(function () {
    this.timeout(10000);

    if (this.app && this.app.isRunning()) {
        return this.app.stop();
    }
    return Promise.resolve();
});
beforeEach(function () {
    this.timeout(10000);
    this.app = new Application({
        path: electron,
        args: ['dist/electron/main.js'],
        startTimeout: 10000,
        waitTimeout: 10000,
    });

    return this.app.start();
});

require('require-dir')('./specs');
