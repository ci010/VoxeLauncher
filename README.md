# Untitled

> An WIP Minecraft Launcher based on electron-vue 


## Design

### Tech Stack

This project is using [nodejs](https://nodejs.org/) + [electron](https://electron.atom.io) + [vue](https://vuejs.org).

### File structure:

- main => main process, the guard process. Store most of the states of launcher. It contains three main part and loaded in following order:
    1. config.js => config boot loader, this will load first
    2. store => directory that contains server store template 
    3. windowsManager.js => the basic manager for windows
- renderer => renderer process, store the single state tree and display UI
- universal => some universal things across the main/renderer
    - store => the definition of store
- static => static resources
  - locales => all the localization files

Core minecraft feature is implemented [ts-minecraft](https://github.com/InfinityStudio/ts-minecraft). Therefore some bugs might be cased by this.

### Concept/Structure

The launcher is composed by "server/client" or "main/renderer". They communicates with each other by electron's [ipc main](https://electronjs.org/docs/api/ipc-main) and [ipc renderer](https://electronjs.org/docs/api/ipc-renderer).

The main is the "backend" of the launcher. It manages the windows, and all the persistent data/state of the app. It manages the state by [vuex](https://vuex.vuejs.org/). Once the state/data has been modified by a [vuex commit](https://vuex.vuejs.org/guide/mutations.html), it will broadcast a ipc message containing the [mutation info]((https://vuex.vuejs.org/guide/mutations.html)) the all the renderer. At the same time, it will trigger the save action of the modified module to write the change on disk.

The renderer is/are just (a) browsers which communicate with main. It maintains a copy of the store. (I can be a full copy, or a partial copy) User's input will trigger an [action](https://vuex.vuejs.org/guide/actions.html) or [commit](https://vuex.vuejs.org/guide/mutations.html), and it will be sync to the main. Though, it does't require any extra action for developer. The local commit and action will automatically send to main. The developer can treat the renderer as a normal vue application.

### Using Vscode Typescript Intellisense

The project is mainly written by js. Though, by adding tricky typescript definition files (d.ts), we can have useful code snippets even for vue commit/dispatch! That really save my brain and improve the productivity. See the [store definition file](src/universal/store/store.d.ts) for more details.

#### LICENSE 

[MIT](LICENSE)

#### Dev

(require nodejs installed in your pc, [nodejs download](https://nodejs.org/))

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run dev

# build electron application for production, don't run this unless you really want to make a product env.... use npm run dev to dev
npm run build

# run unit tests, whereas no tests yet
npm test
```

#### Credit

[Jin](https://github.com/Indexyz), [LG](https://github.com/LasmGratel), [Phoebe](https://github.com/PhoebezZ), [Sumeng Wang](https://github.com/darkkingwsm), [Luca](https://github.com/LucaIsGenius), [Charles Tang](https://github.com/CharlesQT)

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
