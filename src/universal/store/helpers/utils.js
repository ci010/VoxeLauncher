

export function requireNumber(object, message) {
    if (typeof object !== 'number') throw new Error(message || 'Require a number!');
}

export function requireObject(object, message) {
    if (typeof object !== 'object') throw new Error(message || 'Require a object!');
}

export function requireString(object, message) {
    if (typeof object !== 'string') throw new Error(message || 'Require a string!');
}

export function requireType(object, type, message) {
    if (!(object instanceof type)) {
        throw new Error(message || `Require object ${object} be the type ${type}`);
    }
}
export function isNullOrUndefine(object) {
    return object === undefined || object === null;
}

export function fitin(state, option) {
    if (isNullOrUndefine(option)) return;
    for (const key of Object.keys(option)) {
        const stateValue = state[key];
        const optionValue = option[key];

        if (!isNullOrUndefine(optionValue)) {
            const expectType = typeof stateValue;
            if (expectType === 'object') {
                if (stateValue instanceof Array
                    && optionValue instanceof Array) {
                    state[key] = optionValue;
                } else if (typeof optionValue === 'object') {
                    fitin(stateValue, optionValue);
                }
            } else {
                state[key] = optionValue;
            }
        }
    }
}
