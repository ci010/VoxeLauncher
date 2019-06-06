export default {
    mounted() {
        this.load();
    },
    destroyed() {
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
