
import { loading } from '../index';

/**
 * @type {import('vuex').Plugin<any>}
 */
function autosave(store) {
    store.subscribe(
        (mutation) => {
            if (loading()) return;
            store.dispatch('save', { mutation: mutation.type, payload: mutation.payload });
        },
    );
}

export default autosave;
