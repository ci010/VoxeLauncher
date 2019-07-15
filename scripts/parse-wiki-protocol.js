const parser = require('fast-html-parser');
const fs = require('fs');

const filename = process.argv[2];

if (!fs.existsSync(filename)) {
    console.error(`Cannot find file ${filename}`);
    return;
}

const outfile = process.argv[3] || `${filename}`;

const s = fs.readFileSync(filename).toString();
const parsed = parser.parse(s);


const map = {};
const rev = {};

for (const table of parsed.querySelectorAll('table')) {
    const all = table.querySelectorAll('tr');

    let current;
    for (const r of all) {
        const a = r.querySelector('a');
        // eslint-disable-next-line no-continue
        if (!a) continue;
        const name = a.rawText.trim();
        const protocolE = r.querySelectorAll('td')[1];
        if (!protocolE) {
            map[name] = current.trim();
        } else {
            current = protocolE.rawText.trim();
            map[name] = current;
        }
    }
}

for (const [k, v] of Object.entries(map)) {
    if (!rev[v]) {
        rev[v] = [];
    }
    rev[v].push(k);
}

fs.writeFileSync(`${outfile}-mc-protocol`, JSON.stringify(map, null, 4));
fs.writeFileSync(`${outfile}-protocol`, JSON.stringify(rev, null, 4));
