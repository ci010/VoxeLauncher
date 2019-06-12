const fs = require('fs');
const path = require('path');

const base = path.resolve(__dirname, '..', 'static', 'locales');

const files = fs.readdirSync(base).filter(f => f.endsWith('.json')).map(f => path.join(base, f));

function discover(dest, src) {
    const keys = Object.keys(src);
    for (const k of keys) {
        // eslint-disable-next-line no-continue
        if (k === '$schema') continue;
        const v = src[k];
        if (typeof v === 'object') {
            if (!dest[k]) {
                dest[k] = {};
            }
            discover(dest[k], v);
        } else {
            dest[k] = '';
        }
    }
}

function generateSchema(o) {
    const type = typeof o;
    if (type === 'object') {
        const keys = Object.keys(o);
        return {
            type: 'object',
            properties: keys.map(k => ({ [k]: generateSchema(o[k]) })).reduce((a, b) => ({ ...a, ...b })),
            required: keys,
        };
    }
    if (type === 'string') {
        return { type: 'string' };
    }
    throw new Error(o);
}

function sorted(o) {
    const result = {};
    const keys = Object.keys(o).sort();
    for (const key of keys) {
        // eslint-disable-next-line no-continue
        if (key === '$schema') continue;
        if (typeof o[key] === 'object') {
            o[key] = sorted(o[key]);
        }
        result[key] = o[key];
    }
    return result;
}

const powerLang = {};
Promise.all(files.map(processFile)).then(() => {
    const schema = generateSchema(powerLang);
    schema.$id = 'https://raw.githubusercontent.com/ci010/VoxeLauncher/master/static/locale.schema.json';
    fs.writeFileSync(path.resolve(__dirname, '..', 'static', 'locale.schema.json'), JSON.stringify(schema, null, 4));
});

async function processFile(f) {
    const b = await fs.promises.readFile(f);
    const o = JSON.parse(b.toString());
    discover(powerLang, o);
    const result = { $schema: '../locale.schema.json', ...sorted(o) };
    await fs.promises.writeFile(f, JSON.stringify(result, null, 4));
}
