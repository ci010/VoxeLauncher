<template>
	<transition name="scale-transition">
		<v-text-field @focus="focused=true" @blur="focused=false" ref="searchBox" v-show="searchPanel"
		  @keyup="handleKeyUp" @keypress="handleKeyPress" @input="$emit('input', $event)" style="position: fixed; z-index: 2; right: 30px"
		  solo append-icon="filter_list">
		</v-text-field>
	</transition>
</template>

<script>
export default {
  data() {
    return {
      searchPanel: false,
      ctrlKey: '',
      focused: false,
    }
  },
  mounted() {
    document.addEventListener('keypress', this.handleKeyPress);
  },
  destroyed() {
    document.removeEventListener('keypress', this.handleKeyPress);
  },
  methods: {
    handleKeyUp(e) {
      if (e.code === 'Escape') {
        this.searchPanel = false;
      }
    },
    handleKeyPress(e) {
      if (e.code === 'KeyF' && (e.ctrlKey || event.metaKey)) {
        if (this.$el === document.activeElement) {
          this.$nextTick().then(() => {
            this.$refs.searchBox.focus();
          })
        } else {
          this.searchPanel = !this.searchPanel;
        }
      }
    },
  }
}
</script>

<style>
</style>
