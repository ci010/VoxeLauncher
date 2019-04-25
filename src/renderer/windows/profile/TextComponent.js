import { TextComponent } from 'ts-minecraft';

const colorCode = [];
for (let i = 0; i < 32; i += 1) {
    const j = ((i >> 3) & 1) * 85; // eslint-disable-line no-bitwise
    let k = (((i >> 2) & 1) * 170) + j; // eslint-disable-line no-bitwise
    let l = (((i >> 1) & 1) * 170) + j; // eslint-disable-line no-bitwise
    let i1 = ((i & 1) * 170) + j; // eslint-disable-line no-bitwise
    if (i === 6) k += 85;
    if (i >= 16) {
        k /= 4;
        l /= 4;
        i1 /= 4;
    }
    colorCode[i] = ((k & 255) << 16) | ((l & 255) << 8) | (i1 & 255); // eslint-disable-line no-bitwise
}

function itr(comp) {
    const arr = [comp];
    if (comp._siblings.length !== 0) {
        for (const s of comp._siblings) {
            arr.push(...itr(s));
        }
    }
    return arr;
}

export default {
    render(createElement) {
        const arr = [];
        if (!this.source) return createElement('div');
        let iterator;
        if (typeof this.source === 'string') {
            iterator = TextComponent.from(this.$t(this.source, this.args)).iterator;
        } else if (this.source.iterator) {
            iterator = this.source.iterator;
        } else if (this.source._siblings) {
            iterator = itr(this.source);
        }
        if (iterator) {
            for (const component of iterator) {
                const attrs = {};
                if (this.styled === 'true') {
                    let style = '';
                    if (component.style.bold) style += 'font-weight:bold;';
                    if (component.style.underlined) style += 'text-decoration:underline;';
                    if (component.style.italic) style += 'font-style:italic;';
                    if (component.style.strikethrough) style += 'text-decoration:line-through;';
                    if (component.style.color) {
                        const code = colorCode[component.style.color.colorIndex];
                        const r = (code >> 16); // eslint-disable-line no-bitwise
                        const g = ((code >> 8) & 255); // eslint-disable-line no-bitwise
                        const b = (code & 255);// eslint-disable-line no-bitwise
                        style += `color: rgb(${r}, ${g}, ${b});`;
                    } 
                    attrs.style = style;
                }
                arr.push(createElement('span', {
                    attrs,
                }, [component.unformatted]));
            }
        }
        return createElement('p', {}, arr);
    },
    props: {
        source: TextComponent,
        localized: String,
        args: { type: Object, default: () => { Object.create(null); } },
        styled: { type: String, default: 'true' },
    },
};
