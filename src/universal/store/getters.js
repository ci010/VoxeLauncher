import paths from 'path';

export default {
    /**
     * Return the errros by module.
     * @param {CreateOption} state
     */
    errors: (state, getters, rootState) => {
        const settings = [];
        if (!getters.defaultJava) settings.push('setting.nojava');
        const errors = {
        };
        Object.keys(rootState)
            .filter(key => getters[`${key}/errors`] && getters[`${key}/errors`].length !== 0)
            .forEach((key) => { errors[key] = getters[`${key}/errors`]; });
        if (settings.length !== 0) errors.settings = settings;
        return errors;
    },
    errorsCount: (state, getters) => Object.keys(getters.errors)
        .map((k, i, arr) => getters.errors[k].length).reduce((a, b) => a + b, 0),
};
