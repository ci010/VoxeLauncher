<template>
	<div @mousewheel="onScroll" style="height: 100%">
		<v-window v-model="window" style="height: 100%">
			<v-window-item ref="items" v-for="(c, i) in components" :key="i" style="height: 100%">
				<component :selected="i===window && selected" :is="c" @goto="window = $event"></component>
			</v-window-item>
		</v-window>

		<v-layout style="position: absolute; z-index: 2; bottom: 10px; width: 100%" align-center
		  justify-center>
			<v-item-group class="shrink" mandatory tag="v-flex" v-model="window">
				<v-item v-for="(c, i) in components" :key="i">
					<v-icon dark slot-scope="{ active, toggle }" :color="active ? 'primary': ''" @click="toggle">minimize</v-icon>
				</v-item>
			</v-item-group>
		</v-layout>
	</div>
</template>

<script>
import Swappable from './Swappable';

export default {
  mixins: [Swappable],
  props: ['components', 'selected', 'start'],
  watch: {
    selected() {
      if (this.selected) {
        // force to re-trigger vuetify computation of window's height
        this.$refs.items.forEach(v => v.onAfterEnter());
      }
    },
  },
  mounted() {
    if (typeof this.start === 'number') {
      this.window = this.start;
    }
  },
  activated() {
    if (typeof this.start === 'number') {
      this.window = this.start;
    }
  },
  methods: { delta(e) { return e.deltaX; } },
}
</script>

<style>
</style>
