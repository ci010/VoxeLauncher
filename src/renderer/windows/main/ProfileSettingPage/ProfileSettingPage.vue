<template>
	<v-layout align-center fill-height @mousewheel="onScroll">
		<v-item-group v-model="window" class="shrink" mandatory tag="v-flex">
			<v-item v-for="(p, i) in pages" :key="i">
				<div slot-scope="{ active, toggle }">
					<v-btn small dark :input-value="active" icon @click="toggle">
						<v-icon small :color="active ? 'primary': ''">lens</v-icon>
					</v-btn>
				</div>
			</v-item>
		</v-item-group>

		<v-flex fill-height>
			<v-window v-model="window" vertical>
				<v-window-item v-for="(p, i) in pages" :key="i">
					<component :is="p" :selected="i === window"></component>
				</v-window-item>
			</v-window>
		</v-flex>
	</v-layout>
</template>

<script>
import GameSetting from './GameSetting';
import BaseSetting from './BaseSetting';
import ResourcePackSetting from './ResourcePackSetting';
import ForgeSetting from './ForgeSetting';

export default {
  data: () => ({
    pages: ['base-setting', 'game-setting', 'resource-pack-setting', 'forge-setting'],
    window: 0,
    cooldown: false,
  }),
  components: {
    BaseSetting,
    GameSetting,
    ResourcePackSetting,
    ForgeSetting,
  },
  methods: {
    onScroll(e) {
      if (this.cooldown) return;
      const delta = Math.abs(e.deltaY);
      const sign = Math.sign(e.deltaY);
      if (delta > 50) {
        this.window += 1 * sign;
        if (this.window >= this.pages.length) {
          this.window = 0;
        } else if (this.window < 0) {
          this.window = this.pages.length - 1;
        }
        this.cooldown = true;
        setTimeout(() => { this.cooldown = false }, 600);
      }
    }
  },
}
</script>

<style>
</style>
