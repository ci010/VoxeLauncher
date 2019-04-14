import { net, app } from 'electron';
import os from 'os';
import fs, { createReadStream } from 'fs-extra';
import { DownloadService } from 'ts-minecraft';
import path from 'path';
import Zip from 'jszip';
import Task from 'treelike-task';
import unzipper from 'unzipper';
import { createDecompressor } from 'lzma-native';
import { createHash } from 'crypto';

/**
 * Request https://api.github.com/repos/Indexyz/ojrebuild/releases
 * 
 * and download the jre
 * 
 * @param {Task.Context} context 
 */
export async function indexyzEndpoint(context) {
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

/**
 *  
 * 
 * @param {Task.Context} context 
 */
export async function officialEndpoint(context) {
    const root = app.getPath('userData');
    function resolveArch() {
        switch (os.arch()) {
            case 'x86':
            case 'x32': return '32';
            case 'x64': return '64';
            default: return '32';
        }
    }
    function resolveSystem() {
        switch (os.platform()) {
            case 'darwin': return 'osx';
            case 'win32': return 'windows';
            case 'linux': return 'linux';
            default: return '';
        }
    }
    const info = await context.execute('fetchInfo', () => new Promise((resolve, reject) => {
        const req = net.request('https://launchermeta.mojang.com/mc/launcher.json');
        req.on('response', (response) => {
            let str = '';
            response.on('data', (buf) => { str += buf.toString(); });
            response.on('end', (buf) => { resolve(JSON.parse(str)); });
        });
        req.end();
    }));
    const system = resolveSystem();
    const arch = resolveArch();
    if (system === '' || system === 'linux') {
        return '';
    }
    const { sha1, url, version } = info[system][arch].jre;

    const filename = path.basename(url);
    const dest = path.resolve(root, 'temp', filename);

    let needDownload = true;
    if (fs.existsSync(dest)) {
        needDownload = await new Promise((resolve, reject) => {
            const hash = createHash('sha1');
            fs.createReadStream(dest)
                .pipe(hash)
                .on('finish', () => { resolve(hash.digest('hex') !== sha1); });
        });
    }
    if (needDownload) {
        await fs.ensureFile(dest);
        await context.execute('download', DownloadService.downloadTask({
            url,
            checksum: {
                algorithm: 'sha1',
                hash: sha1,
            },
        }, fs.createWriteStream(dest)));
    }

    const javaRoot = path.resolve(root, 'jre');
    await context.execute('decompress', async () => {
        await fs.ensureDir(javaRoot);

        await fs.createReadStream(dest)
            .pipe(createDecompressor())
            .pipe(unzipper.Extract({ path: javaRoot }))
            .promise();
    });
    await context.execute('cleanup', async () => {
        await fs.unlink(dest);
    });
    return version;
}
