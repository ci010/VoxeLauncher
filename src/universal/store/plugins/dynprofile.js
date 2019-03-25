import uuid from 'uuid';
import { Store } from 'vuex';
// import profile from '../modules/profiles/profile';

export default
    /**
     * @param {Store<any>} store
     */
    (store) => {
        store.subscribe((mutation, state) => {
            // const type = mutation.type;
            // const payload = mutation.payload;
            // const rawPaths = type.split('/');
            // const paths = rawPaths.slice(0, rawPaths.length - 1);
            // const action = rawPaths[rawPaths.length - 1];
            // if (type === 'profiles/add') {
            //     const { id } = payload;
            //     const profileType = payload.type;
            //     if (!id) {
            //         console.error(`Unexpect empty id for adding! @${mutation.type}`);
            //         return;
            //     }
            //     paths.push(id);
            //     const model = { ...profile };
            //     model.state = profile.state();
            //     model.state.id = id;
            //     store.registerModule(paths, model);
            // } else if (type === 'profiles/remove') {
            //     if (!payload) {
            //         console.error(`Unexpect empty payload for removal! @${mutation.type}`);
            //         return;
            //     }
            //     paths.push(payload);
            //     store.unregisterModule(paths);
            // }
        });
    };
