import hparser from 'fast-html-parser';
import { net } from 'electron';
import http from 'http';
import https from 'https';
import urls from 'url';

const cache = {};

function usingElectron() {
    return typeof net === 'object';
}

function electronRequest(url) {
    return new Promise((resolve, reject) => {
        let s = '';
        const req = net.request(url);
        req.on('response', (msg) => {
            msg.on('data', (b) => { s += b.toString(); });
            msg.on('end', () => { resolve(s); });
        });
        req.on('error', e => reject(e));
        req.end();
    });
}

function nodeRequest(url) {
    return new Promise((resolve, reject) => {
        const protocol = urls.parse(url).protocol;
        let requestor;
        if (protocol === 'http:') {
            requestor = http;
        } else if (protocol === 'https:') {
            requestor = https;
        } else {
            reject(new Error(`Unsupported url ${url}`));
        }
        let buf = '';
        requestor.request(url, (res) => {
            res.on('error', reject);
            res.on('data', (chunk) => { buf += chunk; });
            res.on('end', () => { resolve(buf); });
        }).on('error', reject).end();
    });
}

export default
/**
             * @template T
             * 
             * @param {string|any} url
             * @param {(element:hparser.HTMLElement) => T} parser
             * @returns {Promise<T>}
             */
(url, parser) => {
    if (cache[url]) return Promise.resolve(cache[url]);
    const promise = usingElectron() ? electronRequest(url) : nodeRequest(url);
    return promise
        .then(hparser.parse)
        .then(parser)
        .then((parsed) => {
            if (parsed !== null) {
                cache[url] = parsed;
                setTimeout(() => { delete cache[url]; }, 60000);
            }
            return parsed;
        });
};
