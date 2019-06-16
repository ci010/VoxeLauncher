<template>
	<transition name="scale-transition">
		<v-text-field ref="searchBox" v-show="searchPanel" @keypress="onKeyPress" @input="$emit('input', $event)"
		  style="position: fixed; z-index: 2; right: 30px" solo append-icon="filter_list">
		</v-text-field>
	</transition>
</template>

<script>
export default {
  data() {
    return {
      searchPanel: false,
    }
  },
  mounted() {
    document.addEventListener('keypress', this.handleKey);
  },
  destroyed() {
    document.removeEventListener('keypress', this.handleKey);
  },
  methods: {
    onKeyPress(e) {
    },
    handleKey(e) {
      console.log(e);
      if (e.code === 'KeyF' && e.ctrlKey) {
        this.searchPanel = !this.searchPanel;
        if (this.searchPanel) {
          this.$nextTick().then(() => {
            this.$refs.searchBox.focus();
          })
        }
      }
    },
  }
}
</script>

<style>
</style>
