import Vuex from 'vuex';
import { ipcMain, webContents } from 'electron';


export default
/**
     * @param {Vuex.Store<any>} store
     */
(store) => {
    const mutationHistory = [];
    ipcMain.on('vuex-sync', (event, currentId) => {
        console.log(`sync on renderer: ${currentId}, main: ${mutationHistory.length}`);
        if (currentId === mutationHistory.length) {
            return;
        }
        const mutations = mutationHistory.slice(currentId);
        event.sender.send('vuex-sync', mutations, mutationHistory.length);
    });
    store.subscribe(
        /**
             * @param {{type: string}} mutation 
             */
        (mutation, state) => {
            mutationHistory.push(mutation);
            const id = mutationHistory.length;
            webContents.getAllWebContents().forEach((w) => {
                w.send('vuex-commit', mutation, id);
            });
        },
    );
};
