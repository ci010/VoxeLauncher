
/**
 * @param {any} object
 * @param {string} [message]
 */
export function requireNumber(object, message) {
    if (typeof object !== 'number') throw new Error(message || 'Require a number!');
}

/**
 * @param {any} a 
 * @param {any} b 
 * @returns {boolean}
 */
export function deepEquals(a, b) {
    const ta = typeof a;
    const tb = typeof b;
    if (ta !== tb) return false;
    if (ta === 'object') {
        if (a instanceof Array && b instanceof Array) {
            if (a.length !== b.length) return false;
            return a.every((v, i) => deepEquals(v, b[i]));
        }
        const ka = Object.keys(a);
        const kb = Object.keys(b);
        if (ka.length !== kb.length) return false;
        return ka.every(k => deepEquals(a[k], b[k]));
    }
    return a === b;
}
/**
 * 
 * @param {any} target 
 * @param {any} option 
 * @return {boolean}
 */
export function diff(target, option) {
    if (target === undefined && option === undefined) {
        return false;
    }
    if (target === undefined || option === undefined) {
        return true;
    }
    return !Object.entries(target).every(([k, v]) => deepEquals(option[k], v));
}

/**
 * @param {any} object
 * @param {string} [message]
 */
export function requireObject(object, message) {
    if (typeof object !== 'object') throw new Error(message || 'Require a object!');
}
/**
 * @param {any} object
 * @param {string} [message]
 */
export function requireString(object, message) {
    if (typeof object !== 'string') throw new Error(message || `Require a string! But get ${typeof object}`);
}
/**
 * @param {any} object
 * @param {any} type
 * @param {any} message
 */
export function requireType(object, type, message) {
    if (!(object instanceof type)) {
        throw new Error(message || `Require object ${object} be the type ${type}`);
    }
}
/**
 * @param {null | undefined} object
 */
export function isNullOrUndefine(object) {
    return object === undefined || object === null;
}

/**
 * @param {any} state
 * @param {any} option
 */
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
                // eslint-disable-next-line valid-typeof
            } else if (expectType === typeof optionValue) {
                state[key] = optionValue;
            }
        }
    }
}

/**
 * 
 * @param {any} a 
 */
export function aArr(a) {
    return a instanceof Array;
}
/**
 * @param {any} a
 */
export function aStr(a) {
    if (typeof a !== 'string') throw new Error('Require String');
}

/**
 * @param {any} a
 */
export function aNum(a) {
    if (typeof a !== 'number') throw new Error('Require Number');
}

/**
 * @param {any} a
 */
export function aBool(a) {
    if (typeof a !== 'boolean') throw new Error('Require Boolean');
}

/**
 * @param {any} a
 */
export function aStrArr(a) {
    if (!(a instanceof Array)) throw new Error('Require String Array');
    for (const i of a) if (typeof i !== 'string') throw new Error('Require String Array');
}

/**
 * @param {any} a
 * @param {any} instance
 */
export function aInstance(a, instance) {
    if (!(a instanceof instance)) throw new Error(`Require ${instance}`);
}
