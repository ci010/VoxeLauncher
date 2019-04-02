import { loading } from '../index';

export default (store) => {
    store.subscribe(
        /**
         * @param {{type: string}} mutation 
         */
        (mutation, state) => {
            if (loading()) return;
            const type = mutation.type;
            const idx = type.indexOf('/');
            if (idx === -1) return;
            const paths = type.split('/');
            paths.pop();
            const module = paths.join('/');
            paths.push('save');
            const action = paths.join('/');
            if (store._actions[action]) {
                store.dispatch(action, { mutation: type, object: mutation.payload })
                    .then(() => {
                        console.log(`Module [${module}] saved by ${type}`);
                    }, (err) => {
                        console.warn(`Module [${module}] saving occured an error:`);
                        console.warn(err);
                    })
                    .catch((err) => {
                        console.warn(`Module [${module}] saving occured an error:`);
                        console.warn(err);
                    });
            }
        },
    );
};
