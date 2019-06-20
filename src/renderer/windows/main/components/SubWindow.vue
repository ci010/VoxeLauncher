<template>
	<div style="height: 100%">
		<v-window :value="value" style="height: 100%">
			<v-window-item ref="items" v-for="(c, i) in components" :key="i" style="height: 100%">
				<component :selected="i===value && selected" :is="c" @goto="$emit('goto', $event)"></component>
			</v-window-item>
		</v-window>

		<v-layout style="position: absolute; z-index: 2; bottom: 10px; width: 100%" align-center
		  justify-center>
			<v-item-group class="shrink" mandatory tag="v-flex" :value="value" @value="$emit('value', $event)">
				<v-item v-for="(c, i) in components" :key="i">
					<v-icon dark slot-scope="{ active, toggle }" :color="active ? 'primary': ''" @click="toggle">minimize</v-icon>
				</v-item>
			</v-item-group>
		</v-layout>
	</div>
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
