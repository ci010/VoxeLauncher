const files = require.context('.', false, /\.json$/);
const locales = {};

files.keys().forEach((key) => {
    locales[key.replace(/(\.\/|\.json)/g, '')] = files(key);
});

export default locales;
