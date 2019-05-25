import { ActionContext } from 'vuex';
import querystring from 'querystring';
import paths from 'path';
import parser from 'fast-html-parser';
import { webContents, app } from 'electron';
import request from '../../utils/request';

function localDate(string) {
    const d = new Date(0);
    d.setUTCSeconds(Number.parseInt(string, 10));
    return d.toLocaleDateString();
}

function convert(node) {
    if (node === null || !node) return '';
    let text = '';
    if (node instanceof parser.TextNode) {
        text += node.rawText;
    } else if (node instanceof parser.HTMLElement) {
        if (node.tagName !== null) {
            if (node.tagName === 'a') {
                let attrs = node.rawAttrs === '' ? '' : ` ${node.rawAttrs}`;
                if (node.attributes.href) {
                    const href = node.attributes.href;
                    const rLinkIdx = href.indexOf('remoteUrl=');
                    const newHref = rLinkIdx !== -1 ?
                        `#/external/${href.substring(href.indexOf('remoteUrl=') + 'remoteUrl='.length)}`
                        : `#/external/${href}`;
                    attrs = querystring.unescape(querystring.unescape(attrs.replace(href, newHref)));
                }
                text += `<${node.tagName}${attrs}>`;
            } else {
                const attrs = node.rawAttrs === '' ? '' : ` ${node.rawAttrs}`;
                text += `<${node.tagName}${attrs}>`;
            }
        }
        if (node.childNodes.length !== 0) for (const c of node.childNodes) text += convert(c);
        if (node.tagName !== null) text += `</${node.tagName}>`;
    } else throw new Error(`Unsupported type ${JSON.stringify(node)}`);
    return text;
}

export default {
    namespaced: true,
    state: {},
    actions: {
        projects(context, payload = {}) {
            const { page, version, filter, project } = payload;
            if (typeof project !== 'string') throw new Error('Require project be [mc-mod], [resourcepack]')
            const sort = filter;
            const endpoint = `https://minecraft.curseforge.com/${project}?${querystring.stringify({
                page: page || '0',
                'filter-sort': sort || 'popularity',
                'filter-game-version': version || '',
            })}`;
            const parse = (root) => {
                root = root.removeWhitespace();
                const pages = root.querySelectorAll('.b-pagination-item')
                    .map(pageItem => pageItem.firstChild.rawText)
                    .filter(text => text.length < 5) // hardcode filter out the non page elem 
                    .map(text => Number.parseInt(text, 10))
                    .filter(n => Number.isInteger(n))
                    .reduce((a, b) => (a > b ? a : b));
                const versions = root.querySelector('#filter-game-version').removeWhitespace()
                    .childNodes.map(ver => ({
                        type: ver.attributes.class,
                        text: ver.rawText,
                        value: ver.attributes.value,
                    }));
                const filters = root.querySelector('#filter-sort').removeWhitespace()
                    .childNodes.map(f => ({
                        text: f.rawText,
                        value: f.attributes.value,
                    }));
                const all = root.querySelectorAll('.project-list-item').map((item) => {
                    item = item.removeWhitespace();
                    const noText = n => !(n instanceof parser.TextNode);
                    const [avatar, details] = item.childNodes;
                    let icon;
                    try {
                        icon = avatar.firstChild.firstChild.attributes.src;
                    } catch (e) {
                        icon = '';
                    }
                    const path = avatar.firstChild.attributes.href;
                    let [name, status, categories, description] = details.childNodes;
                    const author = name.lastChild.lastChild.firstChild.rawText;
                    name = name.firstChild.firstChild.rawText;
                    const count = status.firstChild.firstChild.rawText;
                    const date = localDate(status.lastChild.firstChild.attributes['data-epoch']);
                    status = {};
                    description = description.firstChild.rawText;
                    categories = categories.firstChild.childNodes.map((ico) => {
                        const ca = {
                            href: ico.firstChild.attributes.href,
                            icon: ico.firstChild.firstChild.attributes.src,
                        };
                        return ca;
                    });
                    return {
                        path: path.substring(path.lastIndexOf('/') + 1), name, author, description, date, count, categories, icon,
                    };
                });
                return {
                    mods: all,
                    pages,
                    versions,
                    filters,
                };
            };
            return request(endpoint, parse);
        },
        /**
         * Fetch The curseforge mods page content
         * 
         * @param {ActionContext} context 
         * @param {{page:string, version:string, filter:string}} payload 
         * @returns {{mods:ProjectPreview[], pages:string, filters:string[], versions:string[]}}
         */
        mods(context, payload = {}) {
            const { page, version, filter } = payload;
            const sort = filter;
            const endpoint = `https://minecraft.curseforge.com/mc-mods?${querystring.stringify({
                page: page || '',
                'filter-sort': sort || 'popularity',
                'filter-game-version': version || '',
            })}`;
            const parse = (root) => {
                root = root.removeWhitespace();
                const pages = root.querySelectorAll('.b-pagination-item')
                    .map(pageItem => pageItem.firstChild.rawText)
                    .map(text => Number.parseInt(text, 10))
                    .filter(n => Number.isInteger(n))
                    .reduce((a, b) => (a > b ? a : b));
                const versions = root.querySelector('#filter-game-version').removeWhitespace()
                    .childNodes.map(ver => ({
                        type: ver.attributes.class,
                        text: ver.rawText,
                        value: ver.attributes.value,
                    }));
                const filters = root.querySelector('#filter-sort').removeWhitespace()
                    .childNodes.map(f => ({
                        text: f.rawText,
                        value: f.attributes.value,
                    }));
                const all = root.querySelectorAll('.project-list-item').map((item) => {
                    item = item.removeWhitespace();
                    const noText = n => !(n instanceof parser.TextNode);
                    const [avatar, details] = item.childNodes;
                    let icon;
                    try {
                        icon = avatar.firstChild.firstChild.attributes.src;
                    } catch (e) {
                        icon = '';
                    }
                    const path = avatar.firstChild.attributes.href;
                    let [name, status, categories, description] = details.childNodes;
                    const author = name.lastChild.lastChild.firstChild.rawText;
                    name = name.firstChild.firstChild.rawText;
                    const count = status.firstChild.firstChild.rawText;
                    const date = localDate(status.lastChild.firstChild.attributes['data-epoch']);
                    status = {};
                    description = description.firstChild.rawText;
                    categories = categories.firstChild.childNodes.map((ico) => {
                        const ca = {
                            href: ico.firstChild.attributes.href,
                            icon: ico.firstChild.firstChild.attributes.src,
                        };
                        return ca;
                    });
                    return {
                        path: path.substring(path.lastIndexOf('/') + 1), name, author, description, date, count, categories, icon,
                    };
                });
                return {
                    mods: all,
                    pages,
                    versions,
                    filters,
                };
            };
            return request(endpoint, parse);
        },

        /**
         * Query the project detail from path.
         * 
         * @param {ActionContext} context 
         * @param {string} path 
         * @return {Project}
         */
        project(context, path) {
            if (!path || path == null) throw new Error('Curseforge path cannot be null');
            path = `/projects/${path}`;
            const url = `https://minecraft.curseforge.com${path}`;

            const parse = (root) => {
                const descontent = root.querySelector('.project-description');
                const description = convert(descontent);
                const details = root.querySelector('.project-details').removeWhitespace();
                const createdDate = localDate(details.childNodes[1].childNodes[1].firstChild.attributes['data-epoch']);
                const lastFile = localDate(details.childNodes[2].childNodes[1].firstChild.attributes['data-epoch']);
                const totalDownload = details.childNodes[3].childNodes[1].rawText;
                const license = details.childNodes[4].childNodes[1].firstChild.attributes.href;

                const projWrap = root.querySelector('.project-user').removeWhitespace();
                const image = projWrap.firstChild.firstChild.attributes.href;
                const name = projWrap.childNodes[1].firstChild.rawText;

                const files = root.querySelectorAll('.file-tag')
                    .map((f) => {
                        f = f.removeWhitespace();
                        const typeClass = f.firstChild.firstChild.attributes.class;
                        let type = 'unknonwn';
                        if (typeClass.includes('release')) type = 'release';
                        else if (typeClass.includes('alpha')) type = 'alpha';
                        else if (typeClass.includes('beta')) type = 'beta';
                        const href = f.childNodes[1].firstChild.attributes.href;
                        const fname = f.childNodes[1].childNodes[1].rawText;
                        const date = localDate(f.childNodes[1].childNodes[2].attributes['data-epoch']);
                        return {
                            type,
                            href,
                            name: fname,
                            date,
                        };
                    });
                return {
                    image,
                    name,
                    createdDate,
                    lastFile,
                    totalDownload,
                    license,
                    description,
                    downloads: {},
                    // files,
                };
            };

            return request(url, parse);
        },

        /**
         * Query the project downloadable files.
         * 
         * @param {ActionContext} context 
         * @param {{path:string, version:string, page:string}} payload 
         * @return {Downloads}
         */
        files(context, payload = {}) {
            let { page, version } = payload;
            const path = `/projects/${payload.path}`;

            if (!path || path == null) throw new Error('Curseforge path cannot be null');
            version = version || '';
            page = page || 1;
            const url = `
            https://minecraft.curseforge.com${path}/files?filter-game-version=${version}&page=${page}
            `;
            const parse = (filespage) => {
                let pages = filespage.querySelectorAll('.b-pagination-item');
                if (pages.length === 0) {
                    pages = 0;
                } else {
                    pages = filespage.querySelectorAll('.b-pagination-item')
                        .map(pageItem => pageItem.firstChild.rawText)
                        .map(text => Number.parseInt(text, 10))
                        .filter(n => Number.isInteger(n))
                        .reduce((a, b) => (a > b ? a : b));
                }
                const versions = filespage.querySelector('#filter-game-version').removeWhitespace()
                    .childNodes.map(ver => ({
                        type: ver.attributes.class,
                        text: ver.rawText,
                        value: ver.attributes.value,
                    }));
                const files = filespage.querySelectorAll('.project-file-list-item')
                    .map(i => i.removeWhitespace())
                    .map(i => ({
                        type: i.firstChild.firstChild.attributes.title,
                        name: i.childNodes[1].firstChild.childNodes[1].firstChild.rawText,
                        href: i.childNodes[1].firstChild.firstChild.firstChild.attributes.href,
                        size: i.childNodes[2].rawText,
                        date: localDate(i.childNodes[3].firstChild.attributes['data-epoch']),
                        version: i.childNodes[4].firstChild.rawText,
                        downloadCount: i.childNodes[5].rawText,
                    }));
                return { pages, versions, files };
            };
            return request(url, parse);
        },
        /**
         * 
         * @param {ActionContext} context 
         * @param {string} url 
         * @return {string}
         */
        async license(context, url) {
            if (url == null || !url) throw new Error('URL cannot be null');
            const string = await request(`https://minecraft.curseforge.com${url}`);
            return parser.parse(string).querySelector('.module').removeWhitespace().firstChild.rawText;
        },
        /**
         * 
         * @param {ActionContext} context 
         * @param {{project:Project, file:Download}} payload 
         */
        async download(context, payload) {
            const content = webContents.getFocusedWebContents();
            const proxy = await context.dispatch('task/create', { name: 'curseforge.download' }, { root: true });

            try {
                const file = await new Promise((resolve, reject) => {
                    content.session.once('will-download', (event, item, $content) => {
                        const savePath = paths.join(app.getPath('userData'), 'temps', item.getFilename());
                        if (!this.file) item.setSavePath(savePath);
                        item.on('updated', (e) => {
                            proxy.update(item.getReceivedBytes(), item.getTotalBytes());
                        });
                        item.on('done', ($event, state) => {
                            switch (state) {
                                case 'completed':
                                    resolve(savePath);
                                    break;
                                case 'cancelled':
                                case 'interrupted':
                                default:
                                    reject(new Error(state));
                                    break;
                            }
                        });
                    });
                    content.downloadURL(`https://minecraft.curseforge.com${payload.file.href}`);
                });
                await context.dispatch('resource/import', {
                    files: [file],
                    signiture: {
                        source: 'curseforge',
                        date: Date.now(),
                        meta: payload.project,
                    },
                }, { root: true });
                proxy.finish();
            } catch (e) {
                proxy.finish(Object.freeze(e));
            }
        },
    },
};
