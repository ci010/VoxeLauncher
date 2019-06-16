# Voxelauncher

[![Build Status](https://travis-ci.org/ci010/VoxeLauncher.svg?branch=master)](https://travis-ci.org/ci010/VoxeLauncher)

> An WIP Minecraft Launcher based on electron-vue 

## General RoadMap

Alpha: Cover the basic features that the official launcher have.

1. Official Login
2. Basic profile management
3. Skin Preview/Download/Upload
4. Show logs during launch
5. Show crash report after crash

Beta: Cover the basic features related to mods.

1. Manage mods resources and launch with selected mods.
2. Be able to install Forge/Fabric on corresponding Minecraft version.
3. Be able to detect mod version with Forge/Fabric version and Minecraft Version (detect mod compatibility).

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

Core minecraft launcher logic is implemented [ts-minecraft](https://github.com/InfinityStudio/ts-minecraft). Therefore some bugs might be cased by this.

### Concept/Structure

The launcher is composed by "server/client" or "main/renderer". They communicates with each other by electron's [ipc main](https://electronjs.org/docs/api/ipc-main) and [ipc renderer](https://electronjs.org/docs/api/ipc-renderer).

The main is the "backend" of the launcher. It manages the windows, and all the persistent data/state of the app. It manages the state by [vuex](https://vuex.vuejs.org/). Once the state/data has been modified by a [vuex commit](https://vuex.vuejs.org/guide/mutations.html), it will broadcast a ipc message containing the [mutation info]((https://vuex.vuejs.org/guide/mutations.html)) the all the renderer. At the same time, it will trigger the save action of the modified module to write the change on disk.

The renderer is/are just (a) browsers which communicate with main. It maintains a copy of the store. (I can be a full copy, or a partial copy) User's input will trigger an [action](https://vuex.vuejs.org/guide/actions.html) or [commit](https://vuex.vuejs.org/guide/mutations.html), and it will be sync to the main. Though, it does't require any extra action for developer. The local commit and action will automatically send to main. The developer can treat the renderer as a normal vue application.

### Using Vscode Typescript Intellisense

The project is mainly written by js. Though, by adding tricky typescript definition files (d.ts), we can have useful code snippets even for vue commit/dispatch! That really save my brain and improve the productivity. See the [store definition file](src/universal/store/store.d.ts) for more details.


## Dev

This project is designed to easy to dev... hopefully.

### Getting Started

*The installation might be the most hard part.*

The development environment require 3 things:

1. [Nodejs](https://nodejs.org/) version >= 10
2. python 2.7
3. msbuild (Sindows) , clang (MacOs), gcc (linux desktop)

#### Windows Env Tip

If you have neither python 2.7 nor msbuild, you should try
[windows-build-tools](https://github.com/felixrieseberg/windows-build-tools). It really simplify the verbose installation process. You can just run `npm install --global windows-build-tools` and wait it done.

*Notice that the visual studio installation process is really slow. Some time the process will FREEZE. You can terminate the installation process and run the installation command again.*

#### Mac Env Tip

Python 2.7 should be built in. You should install XCode in addition. 

#### Linux Env Tip

Never tried. I don't have a linux desktop machine.

#### 解决中国国内安装依赖（如electron）太慢的办法

打开你的 git bash，在`npm i`前面加上`registry=https://registry.npm.taobao.org electron_mirror="https://npm.taobao.org/mirrors/electron/"`。使用国内阿里提供的npm以及electron的镜像。

最终输入的command也就是

```bash
registry=https://registry.npm.taobao.org electron_mirror="https://npm.taobao.org/mirrors/electron/" npm i
```

### General Process

``` bash
# optional on Windows to install build tools
npm install --global windows-build-tools

# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run dev

# build electron application for production, don't run this unless you really want to make a product env.... use npm run dev to dev
npm run build

# run unit tests, whereas no tests yet
npm test
```

### Let Typescript Intellisense to help you

The launcher core is in [seperated project](https://github.com/ci010/ts-minecraft) written in typescript. 

At the same time, the launcher core logic is guard by typescript definition file. Since the project enable the `checkJs` option in `jsconfig.json`. The vscode editor will perform type check on the vuex store part, which enable the type intellisense on usage of vuex. 

For example, you will get intellisense during you write the vuex module:

![image](/misc/typehint0.png)

Also, the vscode will hint you in .vue files:

![](/misc/typehint1.png)

You may already notice that, in .vue file, it uses `$repo` but not `$store` property to access vuex store. This is just a redirect. `$repo` is just another reference of `$store`. It's necessary to let the type system accept my type definitoin.

Each vuex module has a corresponding definitoin file. If you want to add a state/getter/mutation/action to a module, you should firstly add the definition of that state/getter/mutation/action in the definition file.

The project overwrite the some vue/vuex definition. You can check [this file](/src/universal/store/store.d.ts) to see the implemantion detail.

### A better Dev experience with VSCode debugger 

The project includes vscode debugger configs. You can add breakpoint on line and debug. Currently, VSCode debugger method only supports debug on main process. 

(You can use chrome devtool for renderer process anyway)

We have two options now:

1. Electron: Main (npm)
2. Electron: Main (attach)

Please use the attch option since the first one not work now.

With attach option, you should first run `npm run dev`, and then attach debugger by VSCode debugger UI.

### Commit your code

This project follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0-beta.3/). In short, the first line of your commit message should be:

```
commit type: commit description
```

There are several avaiable commit type: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`.

Refer from [this gist](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716):

> feat: (new feature for the user, not a new feature for build script)
>
> fix: (bug fix for the user, not a fix to a build script)
>
> docs: (changes to the documentation)
>
> style: (formatting, missing semi colons, etc; no production code change)
>
> refactor: (refactoring production code, eg. renaming a variable)
>
> test: (adding missing tests, refactoring tests; no production code change)
>
> chore: (updating grunt tasks etc; no production code change)

**Your commit will be rejected if you do not follow these rules.**

## LICENSE 

[MIT](LICENSE)

## Credit

[Jin](https://github.com/Indexyz), [LG](https://github.com/LasmGratel), [Phoebe](https://github.com/PhoebezZ), [Sumeng Wang](https://github.com/darkkingwsm), [Luca](https://github.com/LucaIsGenius), [Charles Tang](https://github.com/CharlesQT)

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
