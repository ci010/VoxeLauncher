/**
 * The file enables `universal/store/index.js` to import all vuex modules
 * in a one-shot manner. There should not be any reason to edit this file.
 */

const files = require.context('.', false, /\.js$/);
/**
 * @type {import('vuex').ModuleTree<import('universal/store/store').BaseState>}
 */
const modules = {};

files.keys().forEach((key) => {
    if (key === './index.js') return;
    modules[key.replace(/(\.\/|\.js)/g, '')] = files(key).default;
});

export default modules;
