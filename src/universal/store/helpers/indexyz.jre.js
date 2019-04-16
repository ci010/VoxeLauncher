import { net, app } from 'electron';
import os from 'os';
import fs from 'fs-extra';
import { DownloadService } from 'ts-minecraft';
import path from 'path';
import Zip from 'jszip';
import Task from 'treelike-task';

/**
 * Request https://api.github.com/repos/Indexyz/ojrebuild/releases
 * 
 * and download the jre
 * 
 * @param {Task.Context} context 
 */
export default async function indexyzEndpoint(context) {
    function resolveArch() {
        switch (os.arch()) {
            case 'x86':
            case 'x32':
                return 'x86';
            case 'x64':
                return 'x86_64';
            default:
                return 'x86';
        }
    }
    function resolveBuildSystemId() {
        switch (os.platform()) {
            case 'win32':
                return 'windows';
            case 'linux':
                return 'el6_9';
            case 'darwin':
            default:
                return '';
        }
    }
    const info = await context.execute('fetchingInfo', () => new Promise((resolve, reject) => {
        const req = net.request({
            method: 'GET',
            protocol: 'https:',
            hostname: 'api.github.com',
            path: '/repos/Indexyz/ojrebuild/releases',
        });
        req.setHeader('User-Agent', 'ILauncher');
        req.end();
        let infojson = '';
        req.on('response', (response) => {
            response.on('data', (data) => {
                infojson += data.toString();
            });
            response.on('end', () => {
                resolve(JSON.parse(infojson));
            });
            response.on('error', (e) => {
                console.error(`${response.headers}`);
            });
        });
        req.on('error', (err) => {
            reject(err);
        });
    }));

    const downloadURL = context.execute('resolveSystem', () => {
        const latest = info[0];
        const buildSystemId = resolveBuildSystemId();
        const arch = resolveArch();
        if (!buildSystemId) throw new Error(`Not supporting system ${os.platform()}`);
        if (!arch) throw new Error(`Not supporting arch ${os.arch()}`);
        return latest.assets.map(ass => ass.browser_download_url)
            .filter((ass) => {
                const arr = ass.split('.');
                const actualArch = arr[arr.length - 2];
                const actualSystemId = arr[arr.length - 3];
                return actualArch === arch && actualSystemId === buildSystemId;
            })[0];
    });


    const filename = path.basename(downloadURL);
    const tempFile = path.join(app.getPath('temp'), filename);
    await fs.ensureFile(tempFile);

    await context.execute('downloadJre', DownloadService.downloadTask(downloadURL, tempFile));

    const jreRoot = path.join(app.getPath('userData'), 'jre');
    // const zip = await new Zip().loadAsync(await fs.readFile(tempFile));

    await context.execute('decompressJre', async (context) => {
        context.update(-1, -1, 'preparing');
        const zip = await new Zip().loadAsync(fs.createReadStream(tempFile));

        const total = Object.keys(zip.files).length;
        context.update(0, total, 'ready');
        const arr = [];
        let done = 0;
        zip.forEach((name, entry) => {
            const target = path.resolve(jreRoot, name);
            arr.push(entry.async('nodebuffer')
                .then(buf => fs.ensureFile(target).then(() => buf))
                .then(buf => fs.writeFile(target, buf)))
                .then(() => { context.update(done += 1, total, 'decompressing'); });
        });
        await Promise.all(arr);

        await fs.unlink(tempFile);
    });
}
