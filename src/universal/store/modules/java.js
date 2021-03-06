import Vue from 'vue';
import { requireString, requireObject } from '../../utils/object';
/**
 * @type { import("./java").JavaModule }
 */
const mod = {
    state: {
        all: [],
        default: 0,
    },
    getters: {
        defaultJava: state => state.all[state.default],
        missingJava: state => state.all.length === 0,
    },
    mutations: {
        addJava(state, java) {
            if (java instanceof Array) {
                for (const j of java) {
                    const existed = state.all.find(jp => jp.path === j.path);
                    if (existed) {
                        existed.majorVersion = j.majorVersion;
                        existed.version = j.version;
                    } else {
                        state.all.push(j);
                    }
                }
            } else {
                const existed = state.all.find(j => j.path === java.path);
                if (existed) {
                    existed.majorVersion = java.majorVersion;
                    existed.version = java.version;
                } else {
                    state.all.push(java);
                }
            }
            if (state.default >= state.all.length) state.default = 0;
        },
        removeJava(state, java) {
            requireObject(java);
            requireString(java.path);
            for (let i = 0; i < state.all.length; i++) {
                const j = state.all[i];
                if (j.path === java.path && j.version === java.version) {
                    Vue.delete(state.all, i);
                    if (state.all.length === 0) state.default = 0;
                    return;
                }
            }
        },
        defaultJava(state, def) {
            requireObject(def);
            requireString(def.path);

            const i = state.all.indexOf(def);
            if (i !== -1) {
                state.default = i;
            }
        },
    },
};

export default mod;
