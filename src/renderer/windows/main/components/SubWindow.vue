<template>
  <v-window :value="value" style="height: 100%">
    <v-window-item v-for="(c, i) in components" ref="items" :key="i" style="height: 100%">
      <component :is="c" :selected="i===value && selected" @goto="$emit('goto', $event)" />
    </v-window-item>
  </v-window>
</template>

<script>

export default {
  props: ['components', 'selected', 'value'],
  watch: {
    selected() {
      if (this.selected) {
        // force to re-trigger vuetify computation of window's height
        this.$refs.items.forEach(v => v.onAfterEnter());
      }
    },
  },
};
</script>

<style>
</style>
