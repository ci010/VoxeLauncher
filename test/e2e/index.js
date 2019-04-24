import Vue from 'vue';
import Vuex from 'vuex';
import fs from 'fs-extra';
import electron from 'electron';
import { Application } from 'spectron';
import storeTemplate from '../../src/universal/store';

Vue.config.devtools = false;
Vue.config.productionTip = false;

// require all test files (files that ends with .spec.js)
const testsContext = require.context('./specs', true, /\.spec\.js$/);
testsContext.keys().forEach(testsContext);

// require all src files except main.js for coverage.
// you can also change this to match only the subset of files that
// you want coverage for.
// const srcContext = require.context('../../src/universal', true, /^\.js$/);
// srcContext.keys().forEach(srcContext);

fs.emptyDirSync('temp');

beforeEach(function () {
    this.store = undefined;
    const template = { ...storeTemplate, state: { root: 'temp' } };
    this.store = new Vuex.Store(template);
});

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
