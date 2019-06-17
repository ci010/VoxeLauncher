import Vue from 'vue';

const files = require.context('.', false, /\.vue$/);

files.keys().forEach((key) => {
    const name = key.replace(/(\.\/|\.vue)/g, '');
    const aCode = 'A'.charCodeAt(0);
    const zCode = 'Z'.charCodeAt(0);
    let realName = '';

    for (let i = 0; i < name.length; ++i) {
        const c = name.charCodeAt(i);
        if (c >= aCode && c <= zCode) {
            if (i !== 0) {
                realName += `-${name.charAt(i).toLowerCase()}`;
            } else {
                realName += name.charAt(i).toLowerCase();
            }
        } else {
            realName += name.charAt(i);
        }
    }

    const comp = files(key).default;
    Vue.component(realName, comp);
});
