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
				<v-window-item v-for="(p, i) in components" :key="i">
					<sub-window v-if="p.length > 1" :start="starts[i]" :selected="i === window" :components="p">
					</sub-window>
					<component v-else :is="p[0]" :selected="i === window"></component>
				</v-window-item>
			</v-window>
		</v-flex>
	</v-layout>
</template>

<script>
import Vue from 'vue';

import ModPackSetting from './ModPackSetting';
import BaseSetting from './BaseSetting';
import AdvacedSetting from './AdvacedSetting';
import GameSetting from './GameSetting';
import ResourcePackSetting from './ResourcePackSetting';
import ModSetting from './ModSetting';

import SubWindow from './SubWindow';

Vue.component('mod-pack-setting', ModPackSetting);
Vue.component('base-setting', BaseSetting);
Vue.component('advansed-setting', AdvacedSetting);
Vue.component('game-setting', GameSetting);
Vue.component('resource-pack-setting', ResourcePackSetting);
Vue.component('mod-setting', ModSetting);

export default {
  components: {
    SubWindow,
  },
  data: () => ({
    starts: [
      1, 0, 0,
    ],
    components: [
      ['mod-pack-setting', 'base-setting', 'advansed-setting'],
      ['game-setting', 'resource-pack-setting'],
      ['mod-setting'],
    ],
    window: 0,
    cooldown: false,
  }),
  methods: {
    onScroll(e) {
      if (this.cooldown) return;
      const delta = Math.abs(e.deltaY);
      const sign = Math.sign(e.deltaY);
      if (delta > 50) {
        this.window += 1 * sign;
        if (this.window >= this.components.length) {
          this.window = 0;
        } else if (this.window < 0) {
          this.window = this.components.length - 1;
        }
        this.cooldown = true;
        setTimeout(() => { this.cooldown = false }, 600);
      }
    }
  },
}
</script>

<style>
.v-window__container {
  height: 100%;
}
</style>
