/* eslint-disable guard-for-in */
import Vue from 'vue';
import Vuex from 'vuex';
import { app, ipcMain } from 'electron';

import storeTemplate from 'universal/store';
import plugins from './plugins';

let isLoading = false;
let store;

const initer = [];
const loaders = [];

storeTemplate.plugins.push(...plugins);
Vue.use(Vuex);

/**
 * 
 * @param {Vuex.Module} mo 
 * @param {Array<string>} container 
 */
function discoverLoader(mo, path, container, initer) {
    if (mo.actions && mo.actions.load && mo.namespaced) {
        container.push([...path, 'load'].join('/'));
    }
    if (mo.actions && mo.actions.init && mo.namespaced) {
        initer.push([...path, 'init'].join('/'));
    }
    if (mo.modules) {
        Object.keys(mo.modules).forEach((k) => {
            discoverLoader(mo.modules[k], [...path, k], container, initer);
        });
    }
    return container;
}

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

function resolveDependencies(template) {
    const moduleTree = {};
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

    console.log(moduleTree);

    const visited = {};
    const dest = {};

    Object.keys(moduleTree).forEach((name) => {
        dest[name] = [];
    });

    function visit(m, bag) {
        if (visited[m]) return;

        visited[m] = true;

        const thisBag = bag || dest[m];
        for (const dep of moduleTree[m]) {
            visit(dep, thisBag);
        }

        thisBag.push(m);
    }

    Object.keys(moduleTree).forEach((name) => {
        visit(name, dest[name]);
    });

    console.log(dest);

    return dest;
}

discoverLoader(storeTemplate, [], loaders, initer);
/**
 * 
 * @param {string} root 
 * @returns {Promise<Vuex.Store>}
 */
async function load() {
    const root = app.getPath('userData');

    const template = deepCopyStoreTemplate(storeTemplate);
    template.state.root = root; // pre-setup the root

    const order = resolveDependencies(template);
    // .map(v => `${v}/load`);

    isLoading = true;
    const newStore = new Vuex.Store(template);
    // load
    const successeds = [];
    await Promise.all(loaders
        .filter(action => newStore._actions[action] !== undefined)
        .sort((actionA, actionB) => order.indexOf(actionA) - order.indexOf(actionB))
        .map(action => newStore.dispatch(action).then(() => {
            successeds.push(action);
        }, (err) => {
            console.error(`An error occured when we load module [${action.substring(0, action.indexOf('/'))}].`);
            console.error(err);
        })));
    const diag = `Successfully loaded ${successeds.length} modules: \n ${successeds.map(s => `[${s}]`).join(', ')}.`;
    console.log(diag);

    while (successeds.length !== 0) successeds.pop();

    // init
    await Promise.all(initer.filter(action => newStore._actions[action] !== undefined)
        .map((action) => {
            console.log(`Found init action [${action}]`);
            return newStore.dispatch(action).then((instance) => {
                successeds.push(action);
            }, (err) => {
                console.error(`An error occured when we init module [${action.substring(0, action.indexOf('/'))}].`);
                console.error(err);
            });
        }));
    newStore.commit('root', root);
    isLoading = false;
    console.log('Done loading store!');

    /**
     * Force sync the root
     */
    store = newStore;
    ipcMain.emit('store-ready', newStore);
}

ipcMain.on('reload', load);

export function commit(type, payload, option) {
    if (store === undefined) {
        return;
    }
    ipcMain.emit(`precommit/${type}`, { type, payload, option });
    store.commit(type, payload, option);
    ipcMain.emit(`postcommit/${type}`, { type, payload, option });
}

export function dispatch(type, payload, option) {
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
