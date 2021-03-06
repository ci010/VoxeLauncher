import parser from 'fast-html-parser';
import { createWriteStream, promises, existsSync, fstat } from 'fs';
import { ensureFile, ensureDir } from 'main/utils/fs';
import request from 'main/utils/request';
import { join, basename } from 'path';
import querystring from 'querystring';
import { finished } from 'stream';
import Task from 'treelike-task';
import { downloadFileWork, downloadToFolder, got } from 'ts-minecraft/dest/libs/utils/network';
import { promisify } from 'util';
import { bufferEntry, open, openEntryReadStream, walkEntries } from 'yauzlw';
import fileType from 'file-type';
import { cpus } from 'os';

/**
 * @param {string} string 
 */
function localDate(string) {
    const d = new Date(0);
    d.setUTCSeconds(Number.parseInt(string, 10));
    return d.toLocaleDateString();
}

/**
 * @param {any} n
 */
function notText(n) { return !(n instanceof parser.TextNode); }
/**
 * @param {parser.Node | null} node
 */
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
                    const newHref = rLinkIdx !== -1
                        ? `#/external/${href.substring(href.indexOf('remoteUrl=') + 'remoteUrl='.length)}`
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

/**
 * @typedef {import('universal/store/modules/curseforge').CurseForgeModule.Modpack} Modpack
 * @type {import('universal/store/modules/curseforge').CurseForgeModule}
 */
const mod = {
    state: {},
    actions: {
        async importCurseforgeModpack(context, path) {
            const stat = await promises.stat(path);
            if (!stat.isFile()) throw new Error(`Cannot import curseforge modpack ${path}, since it's not a file!`);
            const buf = await promises.readFile(path);
            const fType = fileType(buf);
            if (!fType || fType.ext !== 'zip') throw new Error(`Cannot import curseforge modpack ${path}, since it's not a zip!`);
            const curseForgeRoot = join(context.rootState.root, 'curseforge');


            /**
             * @param {{url:string, dest: string}[]} pool
             * @param {Task.Context} ctx 
             * @param {string[]} modlist
             */
            async function downloadWorker(pool, ctx, modlist) {
                for (let task = pool.pop(); task; task = pool.pop()) {
                    try {
                        // we want to ensure the mod is in the disk
                        // and know the mod's modid & version
                        let res;
                        const { url, dest } = task;
                        const mappingFile = join(curseForgeRoot, `${basename(dest)}.mapping`);
                        let shouldDownload = true;
                        if (existsSync(mappingFile)) {
                            // if we already have the mapping [file id -> resource], we can just check it from memory
                            const [hash, path] = await promises.readFile(mappingFile).then(b => b.toString().split('\n'));
                            const cachedResource = context.rootState.resource.mods[hash];
                            if (cachedResource) {
                                res = cachedResource;
                                shouldDownload = false;
                            }
                        }
                        if (shouldDownload) {
                            // if we don't have the mod, we should download it
                            await downloadFileWork({ url, destination: dest })(ctx);
                            res = await context.dispatch('importResource', { path: dest });
                            await promises.writeFile(mappingFile, `${res.hash}\n${res.path}`);
                            await promises.unlink(dest);
                        }
                        if (res && res.metadata instanceof Array) {
                            const { modid, version } = res.metadata[0];
                            // now we should add this mod to modlist
                            if (modid && version) {
                                modlist.push(`${modid}:${version}`);
                            } else {
                                console.error(`Cannot resolve ${url} as a mod!`);
                                console.error(JSON.stringify(res));
                                throw new Error(`Cannot resolve ${url} as a mod!`);
                            }
                        } else {
                            console.error(`Cannot resolve ${url} as a mod!`);
                            console.error(JSON.stringify(res));
                            throw new Error(`Cannot resolve ${url} as a mod!`);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }

            const task = Task.create('installCurseforgeModpack', async (ctx) => {
                const zipFile = await open(buf, { lazyEntries: true, autoClose: false });
                /** @type {import('yauzlw').Entry[]} */
                const others = [];
                let manifestEntry;
                await walkEntries(zipFile, (entry) => {
                    if (entry.fileName === 'manifest.json') {
                        manifestEntry = entry;
                    } else {
                        others.push(entry);
                    }
                });
                if (!manifestEntry) throw new Error(`Cannot import curseforge modpack ${path}, since it doesn't have manifest.json`);
                const manifestBuf = await bufferEntry(zipFile, manifestEntry);
                /** @type {Modpack} */
                const manifest = JSON.parse(manifestBuf.toString());
                const tempRoot = join(context.rootState.root, 'temp', manifest.name);

                await ensureDir(curseForgeRoot);
                await ensureDir(tempRoot);

                // download required assets (mods)

                const shouldDownloaded = [];
                for (const f of manifest.files) {
                    const mapping = join(curseForgeRoot, `${f.fileId}.mapping`);
                    if (existsSync(mapping)) {
                        const buf = await promises.readFile(mapping);
                        if (existsSync(buf.toString())) {
                            // eslint-disable-next-line no-continue
                            continue;
                        }
                    }
                    shouldDownloaded.push(f);
                }
                const pool = shouldDownloaded.map(f => ({ url: `https://minecraft.curseforge.com/projects/${f.projectId}/files/${f.fileId}/download`, dest: join(tempRoot, f.fileId.toString()) }));

                /** @type {string[]} */
                const modlist = [];
                await Promise.all(cpus().map(_ => ctx.execute('mod', c => downloadWorker(pool, c, modlist))));

                // create profile accordingly 

                const forgeId = manifest.minecraft.modLoaders.find(l => l.id.startsWith('forge'));
                const id = await context.dispatch('createProfile', {
                    name: manifest.name,
                    mcversion: manifest.minecraft.version,
                    author: manifest.author,
                    forge: {
                        version: forgeId ? forgeId.id.substring(5) : '',
                        mods: modlist,
                    },
                });
                const profileFolder = join(context.rootState.root, 'profiles', id);

                // start handle override

                const waitStream = promisify(finished);
                /** @param {import('yauzlw').Entry} o */
                async function pipeTo(o) {
                    const dest = join(profileFolder, o.fileName.substring(manifest.override.length));
                    const readStream = await openEntryReadStream(zipFile, o);
                    return waitStream(readStream.pipe(createWriteStream(dest)));
                }
                if (manifest.override) {
                    const overrides = others.filter(e => e.fileName.startsWith(manifest.override));
                    for (const o of overrides) {
                        const dest = join(profileFolder, o.fileName.substring(manifest.override.length));
                        await ensureFile(dest);
                    }
                    await Promise.all(overrides.map(o => pipeTo(o)));
                }
            });
            return context.dispatch('executeTask', task);
        },
        fetchCurseForgeProjects(_, payload = {}) {
            const { page, version, filter, project } = payload;
            if (typeof project !== 'string') throw new Error('Require project be [mc-mod], [resourcepack]');
            const sort = filter;
            const endpoint = `https://minecraft.curseforge.com/${project}?${querystring.stringify({
                page: page || '0',
                'filter-sort': sort || 'popularity',
                'filter-game-version': version || '',
            })}`;
            return request(endpoint, (root) => {
                root = root.removeWhitespace();
                const pages = root.querySelectorAll('.pagination-item')
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
                const all = root.querySelectorAll('.project-listing-row').map((item) => {
                    item = item.removeWhitespace();

                    const childs = item.childNodes.filter(notText);
                    const iconElem = item.querySelector('.project-avatar').querySelector('a');
                    const url = iconElem.attributes.href;
                    const icon = iconElem.querySelector('img').attributes.src;

                    const mainBody = childs[1].childNodes.filter(notText);
                    const categorysBody = childs[2].childNodes.filter(notText)[1];

                    const baseInfo = mainBody[0].childNodes.filter(notText);
                    const metaInfo = mainBody[1].childNodes.filter(notText);
                    const description = mainBody[2].text;

                    const name = baseInfo[0].querySelector('h3').rawText;
                    const author = baseInfo[2].rawText;
                    const date = metaInfo[1].querySelector('abbr').attributes['data-epoch'];
                    const count = metaInfo[0].rawText.replace(' Downloads', '');

                    const categories = categorysBody.querySelectorAll('a').map(link => ({
                        href: link.attributes.href,
                        icon: link.querySelector('img').attributes.src,
                        title: link.querySelector('figure').attributes.title,
                    }));

                    return {
                        id: url.substring(url.lastIndexOf('/') + 1),
                        path: url.substring(url.lastIndexOf('/') + 1),
                        name,
                        author,
                        description,
                        date,
                        count,
                        categories,
                        icon,
                    };
                });
                return {
                    projects: all,
                    pages,
                    versions,
                    filters,
                };
            });
        },

        fetchCurseForgeProject(context, path) {
            if (!path || path == null) throw new Error('Curseforge path cannot be null');
            path = `/projects/${path}`;
            const url = `https://minecraft.curseforge.com${path}`;

            return request(url, (root) => {
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
                    // downloads: {},
                    // files,
                };
            });
        },

        fetchCurseForgeProjectFiles(context, payload = {}) {
            let { page, version } = payload;
            const path = `/projects/${payload.path}`;

            if (!path || path == null) throw new Error('Curseforge path cannot be null');
            version = version || '';
            page = page || 1;
            const url = `https://minecraft.curseforge.com${path}/files?filter-game-version=${version}&page=${page}`;
            return request(url, (filespage) => {
                const pagesElement = filespage.querySelectorAll('.b-pagination-item');
                let page;
                if (pagesElement.length === 0) {
                    page = 0;
                } else {
                    page = filespage.querySelectorAll('.b-pagination-item')
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
                return { pages: page, versions, files };
            });
        },
        async fetchCurseForgeProjectLicense(context, url) {
            if (url == null || !url) throw new Error('URL cannot be null');
            const { body } = await got(`https://minecraft.curseforge.com${url}`);
            return parser.parse(body).querySelector('.module').removeWhitespace().firstChild.rawText;
        },
        async downloadAndImportFile(context, payload) {
            const url = `https://minecraft.curseforge.com${payload.file.href}`;

            const task = Task.create('downloadCurseForgeFile', async (ctx) => {
                const dest = await downloadToFolder({
                    url,
                    destination: context.rootGetters.path('temp'),
                    progress(prog, total) {
                        ctx.update(prog, total, url);
                    },
                });
                ctx.update(-1, -1);
                await context.dispatch('importResource', {
                    path: dest,
                    metadata: {
                        source: 'curseforge',
                        meta: payload.project,
                    },
                });
            });

            return context.dispatch('executeTask', task);
        },
    },
};

export default mod;
