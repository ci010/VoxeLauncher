/* eslint-disable no-nested-ternary */
export default class BaseFormatter {
    constructor() {
        this._caches = Object.create(null);
    }

    interpolate(message, values) {
        if (!values) {
            return [message];
        }
        let tokens = this._caches[message];
        if (!tokens) {
            tokens = parse(message);
            this._caches[message] = tokens;
        }
        return compile(tokens, values);
    }
}


const RE_TOKEN_LIST_VALUE = /^(?:\d)+/;
const RE_TOKEN_NAMED_VALUE = /^(?:\w)+/;

export function parse(format) {
    const tokens = [];
    let position = 0;

    let text = '';
    while (position < format.length) {
        let char = format[position++];
        if (char === '{') {
            if (text) {
                tokens.push({ type: 'text', value: text });
            }

            text = '';
            let sub = '';
            char = format[position++];
            while (char !== undefined && char !== '}') {
                sub += char;
                char = format[position++];
            }
            const isClosed = char === '}';

            const type = RE_TOKEN_LIST_VALUE.test(sub)
                ? 'list'
                : isClosed && RE_TOKEN_NAMED_VALUE.test(sub)
                    ? 'named'
                    : 'unknown';
            tokens.push({ value: sub, type });
        } else if (char === '%') {
            // when found rails i18n syntax, skip text capture
            if (format[(position)] !== '{') {
                text += char;
            }
        } else {
            text += char;
        }
    }

    // eslint-disable-next-line no-unused-expressions
    text && tokens.push({ type: 'text', value: text });

    return tokens;
}

export function compile(tokens, values) {
    const compiled = [];
    let index = 0;

    const mode = Array.isArray(values)
        ? 'list'
        : typeof values === 'object' && values !== null
            ? 'named'
            : 'unknown';
    if (mode === 'unknown') { return compiled; }

    while (index < tokens.length) {
        const token = tokens[index];
        switch (token.type) {
            default:
                break;
            case 'text':
                compiled.push(token.value);
                break;
            case 'list':
                compiled.push(values[parseInt(token.value, 10)]);
                break;
            case 'named':
                if (mode === 'named') {
                    compiled.push((values)[token.value]);
                } else if (process.env.NODE_ENV !== 'production') {
                    console.warn(`Type of token '${token.type}' and format of value '${mode}' don't match!`);
                }
                break;
            case 'unknown':
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('Detect \'unknown\' type of token!');
                }
                break;
        }
        index++;
    }

    return compiled;
}
