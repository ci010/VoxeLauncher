const files = require.context('.', false, /\.json$/);
/**
 * @type {any}
 */
const locales = {};

files.keys().forEach((key) => {
    locales[key.replace(/(\.\/|\.json)/g, '')] = files(key);
});

export default locales;
