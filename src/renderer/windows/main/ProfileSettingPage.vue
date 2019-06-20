<template>
	<v-layout align-center fill-height @mousewheel="onScroll">
		<v-item-group v-model="window" class="shrink" mandatory tag="v-flex">
			<v-item v-for="(p, i) in components" :key="i">
				<div slot-scope="{ active, toggle }">
					<v-btn small dark :input-value="active" icon @click="toggle">
						<v-icon small :color="active ? 'primary': ''">lens</v-icon>
					</v-btn>
				</div>
			</v-item>
		</v-item-group>

		<v-flex fill-height>
			<v-window v-model="window" vertical style="height: 100%">
				<v-window-item v-for="(p, i) in components" :key="i" style="height: 100%">
					<sub-window @scroll="onScroll" v-if="p.length > 1" v-model="subWindows[i]" :selected="i === window"
					  :components="p" @goto="goto">
					</sub-window>
					<component v-else :is="p[0]" :selected="i === window"></component>
				</v-window-item>
			</v-window>
		</v-flex>
	</v-layout>
</template>

<script>
export default {
  data: () => ({
    components: [
      ['version-setting', 'base-setting', 'advanced-setting'],
      ['game-setting', 'resource-pack-setting'],
      ['mod-setting'],
    ],
    subWindows: [
      1, 0, 0
    ],
    window: 0,
    cooldown: false,
    lastX: null,
    lastY: null,
  }),
  methods: {
    computeWinSwap(rawDelta, lastKey, lastValue, length) {
      const delta = Math.abs(rawDelta);
      const last = this[lastKey];
      this[lastKey] = delta;
      if (last > delta) return;
      if (this.cooldown) return;

      const sign = Math.sign(rawDelta);
      console.log(`sign ${sign}`)
      let result = lastValue;
      if (delta > 50) {
        result += 1 * sign;
        if (result >= length) {
          result = 0;
        } else if (result < 0) {
          result = length - 1;
        }
        this.cooldown = true;
        setTimeout(() => { this.cooldown = false; }, 800);
      }
      return result;
    },
    onScroll(e) {
      e.preventDefault();
      e.stopPropagation();
      const lastSub = this.subWindows[this.window];
      this.subWindows[this.window] = this.computeWinSwap(e.deltaX, 'lastX', lastSub, this.components[this.window].length);
      if (lastSub === this.subWindows[this.window]) {
        console.log('b ' + this.window);
        this.window = this.computeWinSwap(e.deltaY, 'lastY', this.window, this.components.length);
        if (this.window === undefined) {
          console.log(e);
        }
        console.log('a ' + this.window);
      }
    },
    goto(e) {
      const [win, subwin] = e;
      this.window = win;
      this.subWindows[win] = subwin;
    },
  },
}
</script>

<style>
.v-window__container {
  height: 100%;
}
</style>
