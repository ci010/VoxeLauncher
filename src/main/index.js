import {
    app,
    BrowserWindow,
    ipcMain,
} from 'electron'
import {
    AuthService,
} from 'ts-minecraft'
import launcher from './launcher'

const devMod = process.env.NODE_ENV === 'development'
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (!devMod) {
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development' ?
    'http://localhost:9080' :
    `file://${__dirname}/index.html`


function createWindow() {
    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow({
        height: 563,
        useContentSize: true,
        width: 1000,
        frame: false,
    })

    mainWindow.loadURL(winURL)

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

function init() {
    ipcMain.on('init', (event, args) => {
        event.sender.send('init', 'pong')
    })

    ipcMain.on('login', (event, args) => {
        const [account, password, mode] = args
        if (mode === 'offline') {
            event.sender.send('login', undefined, AuthService.offlineAuth(account))
        } else {
            AuthService.newYggdrasilAuthService().login(account, password, 'non').then(
                result => event.sender.send('login', undefined, result),
                err => event.sender.send('login', err),
            )
        }
    })
    ipcMain.on('launch', (event, options) => {
        switch (options.type) {
        case 'server':
        case 'modpack':
        default:
        }
    })
    ipcMain.on('save', (event, args) => args.type)
}
app.on('ready', () => {
    init()
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})

const paths = require('path')

function _buildTree() {
    // well this is future work 2333 
    // TODO toposort for module with dependencies and build tree 
}

<<<<<<< HEAD
import launcher from './launcher'

let _reqTreeEventHolder
ipcMain.once('fetchAll', (event) => {
    if (_reqTreeEventHolder) {
        console.log('IO loaded first!')
        event.sender.send('fetchAll', undefined, _reqTreeEventHolder)
    }
    else {
        console.log('Client loaded first!')
        _reqTreeEventHolder = event//place holder, which means tree already required by the renderer process!
    }
    ipcMain.on('fetchAll', () => {
        console.log('remote force reload! implement later...')
    })
});
(function () {
=======
(function() {
>>>>>>> 80c39a12b27d9305dba84183e86f9655b3781a0e
    const context = {
        getPath(path) {
            if (typeof path === 'string') {
                return paths.join(launcher.rootPath, path)
            } else if (path instanceof Array) {
                console.log(`paths  ${path}`)
                return paths.join(launcher.rootPath, path.join(path))
            }
            return launcher.rootPath
        },
    }

<<<<<<< HEAD
    let modules = launcher._modulesIO
    let promises = []
    for (var key in modules) {
        if (modules.hasOwnProperty(key)) {
            var m = modules[key];
            promises.push(m.load(context).then(m => {
                return { id: key, module: m }
            }))
=======
    const modules = launcher._modules
    const promises = []
    for (const key in modules) {
        if (modules.hasOwnProperty(key)) {
            const m = modules[key];
            promises.push(m.load(context))
>>>>>>> 80c39a12b27d9305dba84183e86f9655b3781a0e
        }
    }
    console.log('loaded modules')
    return Promise.all(promises)
<<<<<<< HEAD
})().then(modules => {
=======
})().catch(e => console.log(e));

(function() {
>>>>>>> 80c39a12b27d9305dba84183e86f9655b3781a0e
    console.log('services start init')
    const services = launcher._services
    for (const key in services) {
        if (services.hasOwnProperty(key)) {
            const service = services[key];
            if (service.initialize) {
                service.initialize();
            }
        }
    }
    console.log('services inited')
<<<<<<< HEAD
    return modules
}).then(modules => {
    let tree = {}
    for (let m of modules)
        tree[m.id] = m.module;
    if (_reqTreeEventHolder)
        _reqTreeEventHolder.sender.send('fetchAll', undefined, tree)
    else
        _reqTreeEventHolder = tree
    return tree
}).catch(e => {
    console.log(e)
});

console.log(launcher)

=======
}());
>>>>>>> 80c39a12b27d9305dba84183e86f9655b3781a0e
