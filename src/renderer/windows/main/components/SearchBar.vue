<template>
  <transition name="scale-transition">
    <v-text-field v-show="show" ref="self" style="position: fixed; z-index: 2; right: 30px" solo append-icon="filter_list"
                  @focus="focused=true" @blur="focused=false" @keyup="handleKeyUp"
                  @input="$emit('input', $event)" />
  </transition>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      ctrlKey: '',
      focused: false,
    };
  },
  mounted() {
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('keydown', this.handleKeydown);
  },
  destroyed() {
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('keydown', this.handleKeydown);
  },
  methods: {
    handleKeydown(e) {
      if (e.code === 'KeyF' && (e.ctrlKey || e.metaKey)) {
        if (this.show && !this.focused) {
          this.$nextTick().then(() => {
            this.$refs.self.focus();
          });
        } else {
          this.show = !this.show;
          this.$nextTick().then(() => {
            this.$refs.self.focus();
          });
        }
      }
    },
    handleKeyUp(e) {
      if (e.code === 'Escape') {
        this.show = false;
      }
    },
  },
};
</script>

<style>
</style>
