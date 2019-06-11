
export default {
    data() {
        return {
            cooldown: false,
            window: 1,
        };
    },
    methods: {
        onScroll(e) {
            if (this.cooldown) return;
            const d = this.delta(e);
            const delta = Math.abs(d);
            const sign = Math.sign(d);
            if (delta > 50) {
                this.window += 1 * sign;
                if (this.window >= this.components.length) {
                    this.window = 0;
                } else if (this.window < 0) {
                    this.window = this.components.length - 1;
                }
                console.log(this.window);
                this.cooldown = true;
                setTimeout(() => { this.cooldown = false; }, 600);
            }
        },
    },
};
