<template>
	<v-window :value="value" style="height: 100%">
		<v-window-item ref="items" v-for="(c, i) in components" :key="i" style="height: 100%">
			<component :selected="i===value && selected" :is="c" @goto="$emit('goto', $event)"></component>
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
}
</script>

<style>
</style>
