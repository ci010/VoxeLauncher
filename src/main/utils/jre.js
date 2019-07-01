import { net, app } from 'electron';
import os from 'os';
import { promises as fs, createReadStream, existsSync, mkdirSync } from 'fs';
import { Utils } from 'ts-minecraft';
import path, { join } from 'path';
import Task from 'treelike-task';
import { createExtractStream } from 'yauzlw';
import { createDecompressor } from 'lzma-native';
import { createHash } from 'crypto';
import { downloadFile, downloadFileWork } from 'ts-minecraft/dest/libs/utils/network';
import { exec } from 'child_process';
import { ensureDir, ensureFile } from './fs';

/**
 * @param {Task.Context} context 
 */
export async function officialEndpoint(context) {
    console.log('Try auto Java from Mojang source');
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
            response.on('end', () => { resolve(JSON.parse(str)); });
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
    if (existsSync(dest)) {
        needDownload = await new Promise((resolve, reject) => {
            const hash = createHash('sha1');
            createReadStream(dest)
                .pipe(hash)
                .on('finish', () => { resolve(hash.digest('hex') !== sha1); });
        });
    }
    if (needDownload) {
        await ensureFile(dest);
        await context.execute('download', Utils.downloadFileIfAbsentWork({
            url,
            destination: dest,
            checksum: {
                algorithm: 'sha1',
                hash: sha1,
            },
        }));
    }

    const javaRoot = path.resolve(root, 'jre');
    await context.execute('decompress', async () => {
        await ensureDir(javaRoot);

        await createReadStream(dest)
            .pipe(createDecompressor())
            .pipe(createExtractStream(javaRoot))
            .promise();
    });
    await context.execute('cleanup', async () => {
        await fs.unlink(dest);
    });
    return version;
}


/**
 * @param {Task.Context} context 
 */
export async function selfHostAPI(context) {
    console.log('Try auto Java from self hosted source');
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
    const system = resolveSystem();
    const arch = resolveArch();
    if (system === '' || system === 'linux') {
        return;
    }
    const url = `https://voxelauncher.blob.core.windows.net/jre/jre-${system}-${arch}-1.8.0_51.lzma`;
    const filename = path.basename(url);
    const dest = path.resolve(root, 'temp', filename);

    await ensureFile(dest);
    await context.execute('download', Utils.downloadFileWork({
        url,
        destination: dest,
    }));

    const javaRoot = path.resolve(root, 'jre');
    await context.execute('decompress', async () => {
        await ensureDir(javaRoot);

        await createReadStream(dest)
            .pipe(createDecompressor())
            .pipe(createExtractStream(javaRoot))
            .promise();
    });
    await context.execute('cleanup', async () => {
        await fs.unlink(dest);
    });
}

/**
 * @param {Task.Context} context 
 */
export async function bangbangAPI(context) {
    console.log('Try auto Java from Bangbang source');
    const x64 = os.arch() === 'x64';
    const platform = os.platform();
    function resolveJava() {
        switch (platform) {
            case 'darwin': return 'jre_mac.dmg';
            case 'win32': return x64 ? 'jre_x64.exe' : 'jre_x86.exe';
            case 'linux': return x64 ? 'jre_x64.tar.gz' : 'jre_x86.tar.gz';
            default: return '';
        }
    }
    const filename = resolveJava();
    const root = app.getPath('userData');
    const javaRoot = path.resolve(root, 'jre');
    const destination = path.resolve(root, 'temp', filename);
    await context.execute('download', downloadFileWork({
        url: `http://bmclapi2.bangbang93.com/java/${filename}`,
        destination,
    }));

    function exec_(cmd, option = {}) {
        return new Promise((resolve, reject) => {
            exec(cmd, option, (err, stdout, stderr) => {
                if (err) { reject(err); } else {
                    resolve(stdout);
                }
            });
        });
    }
    switch (platform) {
        case 'darwin':
            await fs.copyFile(join(__static, 'mac-jre-installer.sh'), join(root, 'temp', 'mac-jre-installer.sh'));
            mkdirSync(join(root, 'jre'));
            await exec_(join(root, 'temp', 'mac-jre-installer.sh'), { cwd: root });
            break;
        case 'win32':
            await exec_([destination, `INSTALLDIR=${javaRoot}`, 'STATIC=1', 'INSTALL_SILENT=1', 'SPONSORS=0'].join(' '));
            break;
        case 'linux':
            await exec_(`tar xvzf ${destination} -C ${join(root, 'jre')}`, { cwd: root });
            break;
        default:
            break;
    }
}
