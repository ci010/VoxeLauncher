/* eslint-disable guard-for-in */
import Vue from 'vue';
import Vuex from 'vuex';
import { app, ipcMain } from 'electron';

import storeTemplate from 'universal/store';
import plugins from './plugins';

let isLoading = false;
/**
 * @type {import('vuex').Store<import('universal/store/store').RootState>?}
 */
let store;

if (storeTemplate.plugins) {
    storeTemplate.plugins.push(...plugins);
} else {
    storeTemplate.plugins = plugins;
}
Vue.use(Vuex);


/**
 * @param {typeof storeTemplate} template 
 * @return {typeof storeTemplate} 
 */
function deepCopyStoreTemplate(template) {
    const copy = Object.assign({}, template);
    if (typeof template.state === 'object') {
        copy.state = JSON.parse(JSON.stringify(template.state));
    }
    if (copy.modules) {
        for (const key of Object.keys(copy.modules)) {
            copy.modules[key] = deepCopyStoreTemplate(copy.modules[key]);
        }
    }
    return copy;
}

/**
 * Load the store from disk
 */
async function load() {
    ipcMain.removeAllListeners('vuex-sync');
    store = null;
    const root = app.getPath('userData');
    const template = deepCopyStoreTemplate(storeTemplate); // deep copy the template so there is no strange reference

    // @ts-ignore
    template.state.root = root; // pre-setup the root
    const newStore = new Vuex.Store(template);

    // load
    isLoading = true;

    let startingTime = Date.now();
    try {
        await newStore.dispatch('load');
    } catch (e) {
        console.error(e);
    }
    console.log(`Successfully load modules. Total Time is ${Date.now() - startingTime}ms.`);

    isLoading = false;

    await new Promise((resolve) => {
        if (app.isReady()) resolve();
        else app.once('ready', () => resolve());
    });

    startingTime = Date.now();
    try {
        await newStore.dispatch('init');
    } catch (e) {
        console.error(e);
    }
    console.log(`Successfully init modules. Total Time is ${Date.now() - startingTime}ms.`);

    newStore.commit('root', root);

    console.log('Done loading store!');

    // Force sync the root
    store = newStore;
    ipcMain.emit('store-ready', newStore);
}

ipcMain.on('reload', load);

/**
 * @param {any} type
 * @param {any} payload
 * @param {any} option
 */
export function commit(type, payload, option) {
    if (store === undefined) {
        return;
    }
    ipcMain.emit(`precommit/${type}`, { type, payload, option });
    if (store) {
        store.commit(type, payload, option);
    } else {
        console.error(`Cannot commit ${type} since the store is null.`);
    }
    ipcMain.emit(`postcommit/${type}`, { type, payload, option });
}

/**
 * @param {string} type 
 * @param {any} payload 
 * @param {any} option 
 */
export function dispatch(type, payload, option) {
    if (!store) {
        console.error(`Cannot dispatch ${type} since the store is null.`);
        return Promise.reject(new Error(`Cannot dispatch ${type} since the store is null.`));
    }
    try {
        const result = store.dispatch(type, payload, option);
        if (!(result instanceof Promise)) return Promise.resolve(result);
        return result;
    } catch (e) {
        return Promise.reject(e);
    }
}

export function loading() { return isLoading; }
export function getStore() { return store; }
