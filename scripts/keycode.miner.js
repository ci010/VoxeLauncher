const fs = require('fs');

const lwjgl = fs.readFileSync('./lwjgl.keycode').toString();
const mapping = lwjgl.split('\n').map(line => line.split('\t'))
    .reduce((obj, value) => {
        if (value[1]) obj[value[1]] = Number.parseInt(value[0], 10);
        if (value[2]) obj[value[2]] = Number.parseInt(value[0], 10);
        return obj;
    }, {});

fs.writeFileSync('./keycode.mapping.json', JSON.stringify(mapping, null, 4));
