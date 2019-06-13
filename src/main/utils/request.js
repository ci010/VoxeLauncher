import hparser from 'fast-html-parser';
import { got } from 'ts-minecraft/dest/libs/utils/network';

/**
 * In memory cache
 * @type {{[key:string]: any}}
 */
const cache = {};

/**
 * @template T
 * 
 * @param {string|any} url
 * @param {(element:hparser.HTMLElement) => T} parser
 * @returns {Promise<T>}
 */
async function request(url, parser) {
    if (cache[url]) return cache[url];
    const resp = await got.get(url);
    const parsed = hparser.parse(resp.body);
    const result = parser(parsed);
    if (result) {
        cache[url] = parsed;
        setTimeout(() => { delete cache[url]; }, 60000);
    }
    return result;
}

export default request;
