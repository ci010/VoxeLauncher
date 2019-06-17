export default {
    methods: {
        onMouseWheel(event) { event.stopPropagation(); return true; },
        onDragOver(event) { event.preventDefault(); return false; },
        onDropLeft(event) { return this.handleDrop(event, true); },
        onDropRight(event) { return this.handleDrop(event, false); },
        handleDrop(event, left) {
            event.preventDefault();
            const length = event.dataTransfer.files.length;
            if (length > 0) {
                console.log(`Detect drop import ${length} file(s).`);
                for (let i = 0; i < length; ++i) {
                    this.dropFile(event.dataTransfer.files[i]);
                }
            }
            const indexText = event.dataTransfer.getData('Index');
            if (indexText) {
                const index = Number.parseInt(indexText.substring(1), 10);
                const y = event.clientY;
                if (indexText[0] === 'L') {
                    if (left) {
                        // do nothing now...
                    } else {
                        this.select(index);
                    }
                } else if (left) {
                    this.unselect(index);
                } else {
                    const rightList = this.$el.getElementsByClassName('right').item(0);
                    const all = rightList.getElementsByClassName('draggable-card');
                    for (let i = 0; i < all.length; ++i) {
                        const rect = all.item(i).getBoundingClientRect();
                        if (y < rect.y + rect.height) {
                            this.insert(index, i);
                            break;
                        }
                        if (i === all.length - 1) {
                            this.insert(index, all.length);
                        }
                    }
                }
            }
        },
    },
};
