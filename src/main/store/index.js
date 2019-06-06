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
 * @param {typeof storeTemplate} template 
 */
function resolveDependencies(template) {
    // build module tree

    /** @type {{[name:string]:string[]}}  */
    const moduleTree = {};
    /**
     * @param {string} name 
     * @param {any} m 
     */
    function resolve(name, m) {
        if (m.namespaced) {
            moduleTree[name] = m.dependencies || [];
        }
        if (m.modules) {
            for (const sub in m.modules) {
                const full = name === '' ? sub : `${name}/${sub}`;
                resolve(full, m.modules[sub]);
            }
        }
    }
    resolve('', template);

    // perform toposort

    /** @type {{[name:string]:boolean}}  */
    const visited = {};
    /** @type {{[name:string]:string[]}}  */
    const dest = {};

    Object.keys(moduleTree).forEach((name) => {
        dest[name] = [];
    });

    /**
     * @param {string} name
     * @param {string[]} bag
     */
    function visit(name, bag) {
        if (visited[name]) return;

        visited[name] = true;

        const thisBag = bag || dest[name];
        for (const dep of moduleTree[name]) {
            visit(dep, thisBag);
        }

        thisBag.push(name);
    }

    Object.keys(moduleTree).forEach((name) => {
        visit(name, dest[name]);
    });

    const parallel = Object.keys(dest).filter(k => dest[k].length !== 0).map(k => dest[k].map(m => `${m}/load`));

    return parallel;
}

const order = resolveDependencies(storeTemplate); // resolve the loading order

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
    /** @type {{[action:string]: number}} */
    const startTimes = {};
    /** @type {string[]} */
    const successeds = [];
    const startingTime = Date.now();
    await Promise.all(order.map(async (seq) => {
        // @ts-ignore
        for (const action of seq.filter(action => newStore._actions[action] !== undefined)) {
            startTimes[action] = Date.now();
            await newStore.dispatch(action).then(() => {
                successeds.push(`${action}(${Date.now() - startTimes[action]}ms)`);
            }, (err) => {
                console.error(`An error occured when we load module [${action.substring(0, action.indexOf('/'))}].`);
                console.error(err);
            });
        }
    }));
    while (successeds.length !== 0) successeds.pop();
    console.log(`Successfully loaded ${successeds.length} modules: \n ${successeds.map(s => `[${s}]`).join(', ')}. Total Time is ${Date.now() - startingTime}ms.`);

    newStore.commit('root', root);
    isLoading = false;
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
