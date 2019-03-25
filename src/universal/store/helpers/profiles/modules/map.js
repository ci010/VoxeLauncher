import { WorldInfo } from 'ts-minecraft';
import fs from 'fs-extra';
import Zip from 'jszip';
import paths from 'path';
import Vue from 'vue';

const allFiles = folder =>
    fs.readdirSync(folder)
        .map(file => (fs.lstatSync(`${folder}/${file}`).isDirectory() ? allFiles(`${folder}/${file}`) : [`${folder}/${file}`]))
        .reduce((left, right) => [...left, ...right], []);

export default {
    state: () => [],
    getters: {
        maps: state => state,
    },
    mutations: {
        setMaps(state, maps) {
            state.push(...maps);
        },
        addMap(state, map) {
            state.push(map);
        },
        removeMap(state, map) {
            Vue.delete(state, state.indexOf(map));
        },
    },
    actions: {
        importMap(context, locations) {
            if (typeof locations === 'string') {
                locations = [locations];
            }
            if (!(locations instanceof Array)) {
                throw new Error(`Arugment has to be array! ${locations}`);
            }
            const $import = async (location) => {
                const id = context.getters.id;
                let mapFileName;
                const stat = await fs.stat(location);
                let mapData;
                if (stat.isDirectory()) {
                    const entry = await WorldInfo.findEntry(location);
                    mapData = await WorldInfo.parse(await fs.readFile(paths.join(location, entry)));

                    mapFileName = paths.basename(location);
                    if (await context.dispatch('exist', mapFileName, { root: true })) {
                        mapFileName = `-${mapFileName}`;
                    }

                    await context.dispatch('import', {
                        file: location,
                        toFolder: `profiles/${id}/saves/`,
                        mapFileName,
                    }, { root: true });
                } else {
                    const zip = await Zip().loadAsync(await fs.readFile(location));
                    const entry = await WorldInfo.findEntry(zip);

                    const ext = paths.extname(location);
                    mapFileName = paths.basename(location);
                    mapFileName = mapFileName.substr(0, mapFileName.length - ext.length);
                    if (await context.dispatch('exist', mapFileName, { root: true })) {
                        mapFileName = `-${mapFileName}`;
                    }

                    const entryParentDir = paths.dirname(entry);

                    mapData = await WorldInfo.parse(await zip.file(entry).async('nodebuffer'));
                    for (const file of Object.keys(zip.files).filter(f => !zip.files[f].dir)) {
                        const relativePath = paths.relative(entryParentDir, file);
                        const target = paths.join(context.rootGetters.root, `/profiles/${id}/saves/${mapFileName}/${relativePath}`);
                        const parnet = paths.dirname(target);
                        await fs.ensureDir(parnet);
                        zip.files[file].nodeStream().pipe(fs.createWriteStream(target));
                    }
                }
                mapData.filename = mapFileName;
                context.commit('addMap', mapData);
            };
            return Promise.all(locations.map($import));
        },
        /**
         * 
         * @param {ActionContext} context 
         * @param {{file:string, map:string, zip:boolean}} payload
         */
        async exportMap(context, payload) {
            const id = context.getters.id;
            const exportName = payload.file;
            const map = paths.join(context.rootGetters.root, `profiles/${id}/saves/${payload.map}`);
            if (payload.zip) {
                const targetZip = exportName;
                const zip = new Zip();
                await Promise.all(allFiles(map).map(file =>
                    fs.readFile(file).then(buf => zip.file(paths.relative(map, file), buf)),
                ));
                return fs.writeFile(targetZip, await zip.generateAsync({ type: 'nodebuffer' }));
            }
            return fs.copy(map, exportName);
        },
        deleteMap(context, map) {
            const filename = map.filename;
            return context.dispatch('delete', `profiles/${context.getters.id}/saves/${filename}`, { root: true })
                .then(() => {
                    context.commit('removeMap', map);
                });
        },
        async load(context, payload) {
            const id = context.getters.id;
            const readMap = async (file) => {
                const exist = await context.dispatch('exist', `profiles/${id}/saves/${file}/level.dat`, { root: true });
                console.log(`profiles/${id}/saves/${file}/level.dat`);
                if (!exist) return undefined;
                const levBuf = await context.dispatch('read', {
                    path: `profiles/${id}/saves/${file}/level.dat`,
                    fallback: false,
                }, { root: true });
                if (!levBuf) return undefined;
                const info = WorldInfo.parse(levBuf);
                try {
                    const imgBuf = await context.dispatch('read', {
                        path: `profiles/${id}/saves/${file}/icon.png`,
                        fallback: '',
                    }, { root: true });
                    if (imgBuf) info.icon = `data:image/png;base64, ${imgBuf.toString('base64')}`;
                } catch (e) {
                    console.error(e);
                }
                info.filename = file;
                return info;
            };
            let maps;
            try {
                const files = (await context.dispatch('readFolder', { path: `profiles/${id}/saves` }, { root: true }));
                maps = (await Promise.all(files.map(readMap))).filter(m => m !== undefined);
            } catch (e) {
                console.warn(e);
            }
            maps.id = id;
            context.commit('setMaps', maps);
        },
    },
};
