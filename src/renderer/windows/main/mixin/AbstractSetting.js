export default {
    mounted() {
        this.load();
    },
    destroyed() {
        this.save();
    },
    activated() {
        this.load();
    },
    deactivated() {
        this.save();
    },
    watch: {
        selected() {
            if (this.selected) {
                this.load();
            } else {
                this.save();
            }
        },
    },
    props: {
        selected: {
            type: Boolean,
            default: false,
        },
    },
};
