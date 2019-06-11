<template>
	<div @mousewheel="onScroll">
		<v-window v-model="window" style="height: 100%">
			<v-window-item v-for="(c, i) in components" :key="i">
				<component :selected="i===window && selected" :is="c"></component>
			</v-window-item>
		</v-window>

		<v-layout style="position: absolute; z-index: 2; bottom: 10px; width: 100%" align-center
		  justify-center>
			<v-item-group class="shrink" mandatory tag="v-flex" v-model="window">
				<v-item v-for="(c, i) in components" :key="i">
					<v-btn small dark slot-scope="{ active, toggle }" :input-value="active" icon @click="toggle">
						<v-icon small :color="active ? 'primary': ''">lens</v-icon>
					</v-btn>
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
