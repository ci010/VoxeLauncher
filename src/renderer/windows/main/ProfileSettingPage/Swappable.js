
export default {
    data() {
        return {
            cooldown: false,
            window: 1,
            last: null,
        };
    },
    methods: {
        onScroll(e) {
            const rawDelta = this.delta(e);
            const delta = Math.abs(rawDelta);
            const last = this.last;
            this.last = delta;
            if (last > delta) return;
            if (this.cooldown) return;
            e.preventDefault();
            e.stopPropagation();
            const sign = Math.sign(rawDelta);
            if (delta > 50) {
                this.window += 1 * sign;
                if (this.window >= this.components.length) {
                    this.window = 0;
                } else if (this.window < 0) {
                    this.window = this.components.length - 1;
                }
                this.cooldown = true;
                setTimeout(() => { this.cooldown = false; }, 800);
            }
        },
    },
};
