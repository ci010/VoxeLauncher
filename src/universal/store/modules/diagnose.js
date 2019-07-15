/**
 * @type {import('./diagnose').DiagnoseModule}
 */
const mod = {
    state: {
        fixingProblems: [],
    },
    mutations: {
        startFixProblems(state, problems) {
            state.fixingProblems.push(...problems);
        },
        endFixProblems(state, problems) {
            state.fixingProblems = state.fixingProblems.filter(v => problems.indexOf(v) === -1);
        },
    },
};

export default mod;
