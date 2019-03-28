export function requireNumber(object, message) {
    if (typeof object !== 'number') throw new Error(message || 'Require a number!')
}

export function requireObject(object, message) {
    if (typeof object !== 'object') throw new Error(message || 'Require a object!')
}

export function requireString(object, message) {
    if (typeof object !== 'string') throw new Error(message || 'Require a string!')
}

export function requireType(object, type, message) {
    if (!(object instanceof type)) {
        throw new Error(message || `Require object ${object} be the type ${type}`);
    }
}