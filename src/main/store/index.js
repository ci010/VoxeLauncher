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
    isLoading = true;
    const newStore = new Vuex.Store(template);
    // load
    const suc = [];
    await Promise.all(loaders.filter(action => newStore._actions[action] !== undefined)
        .map((action) => {
            return newStore.dispatch(action).then(() => {
                suc.push(action);
            }, (err) => {
                console.error(`An error occured when we load module [${action.substring(0, action.indexOf('/'))}].`);
                console.error(err);
            });
        }));
    let diag = `Successfully loaded ${suc.length} modules: \n`;
    for (const s of suc) {
        diag += `[${s}]\t`;
    }
    console.log(diag);

    // init
    await Promise.all(initer.filter(action => newStore._actions[action] !== undefined)
        .map((action) => {
            console.log(`Found init action [${action}]`);
            return newStore.dispatch(action).then((instance) => {
                console.log(`Inited [${action}]`);
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
        console.error('shit');
        return;
    }
    store.commit(type, payload, option);
}

export function dispatch(type, payload, option) {
    return store.dispatch(type, payload, option);
}

export function loading() { return isLoading; }
export function getStore() { return store; }
