
/**
 Copyright 2013 James Hight
 
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 
 http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import dns from 'dns';
import net from 'net';
import electron from 'electron';
import { parse } from 'url';

const dnsLookup = dns.lookup;

/**
 * @param {string} val
 */
function createRegex(val) {
    const parts = val.split('*');

    for (let i = 0; i < parts.length; i++) {
        parts[i] = parts[i].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    val = parts.join('.*');
    val = `^${val}$`;

    return new RegExp(val, 'i');
}

/**
 * @param {{[ip: string]: string|RegExp}} mappings
 */
export function override(mappings) {
    const entries = Object.entries(mappings).map(([ip, domain]) => ({
        ip,
        family: net.isIPv4(ip) ? 4 : 6,
        domain: domain instanceof RegExp ? domain : createRegex(domain),
    }));
    /**
     * @typedef {(err: NodeJS.ErrnoException?, address: string|dns.LookupAddress[], family: number)=>void} Callback
     * @param {string} domain
     * @param {number | dns.LookupOptions?|Callback} options
     * @param {Callback|undefined} callback
     */
    function lookup(domain, options, callback) {
        let realCallback = callback;
        let realOptions;
        if (arguments.length === 2 && typeof options === 'function') {
            realCallback = options;
        } else {
            realCallback = () => { };
        }
        if (typeof options === 'object' && options !== null) {
            realOptions = options;
        } else {
            realOptions = {};
        }
        let family = typeof (options) === 'object' && options !== null ? options.family : options;
        if (family) {
            family = +family;
            if (family !== 4 && family !== 6) {
                throw new Error('invalid argument: `family` must be 4 or 6');
            }
        }

        for (const e of entries) {
            if (domain.match(e.domain) && !family || family === e.family) {
                return realCallback(null, e.ip, e.family);
            }
        }

        return dnsLookup(domain, realOptions, realCallback);
    }
    // @ts-ignore
    dns.lookup = lookup;
}

export function unoverride() {
    dns.lookup = dnsLookup;
}

const electronRequest = electron.net.request;


/**
 * @param {{[ip: string]: string|RegExp}} mappings
 */
export function overrideNet(mappings) {
    const entries = Object.entries(mappings).map(([ip, domain]) => ({
        ip,
        family: net.isIPv4(ip) ? 4 : 6,
        domain: domain instanceof RegExp ? domain : createRegex(domain),
    }));
    /**
     * @param {any} option
     */
    function request(option) {
        let realOption = option;
        if (typeof option === 'string') {
            const { host, protocol, port, path } = parse(option);
            if (host) {
                for (const e of entries) {
                    if (host.match(e.domain)) {
                        realOption = {
                            method: 'GET',
                            host: e.ip,
                            protocol,
                            port,
                            path,
                        };
                        break;
                    }
                }
            }
        } else if (typeof option === 'object') {
            const url = option.url;
            if (url) {
                const { host, protocol, port, path } = parse(url);
                if (host) {
                    for (const e of entries) {
                        if (host.match(e.domain)) {
                            realOption = {
                                protocol,
                                port,
                                path,
                                ...option,
                                host: e.ip,
                            };
                        }
                        break;
                    }
                }
            }
        }

        return electronRequest(realOption);
    }
    // @ts-ignore
    electron.net.request = request;
}

export function unoverrideNet() {
    electron.net.request = electronRequest;
}
