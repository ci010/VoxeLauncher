<template>
	<v-layout align-center fill-height @mousewheel="onScroll">
		<v-item-group v-model="window" class="shrink" mandatory tag="v-flex">
			<v-item key="0">
				<div slot-scope="{ active, toggle }">
					<v-btn small dark :input-value="active" icon @click="toggle">
						<v-icon small :color="active ? 'primary': ''">lens</v-icon>
					</v-btn>
				</div>
			</v-item>
			<v-item key="1">
				<div slot-scope="{ active, toggle }">
					<v-btn small dark :input-value="active" icon @click="toggle">
						<v-icon small :color="active ? 'primary': ''">lens</v-icon>
					</v-btn>
				</div>
			</v-item>
			<v-item key="2">
				<div slot-scope="{ active, toggle }">
					<v-btn small dark :input-value="active" icon @click="toggle">
						<v-icon small :color="active ? 'primary': ''">lens</v-icon>
					</v-btn>
				</div>
			</v-item>
		</v-item-group>

		<v-flex fill-height>
			<v-window v-model="window" vertical>
				<v-window-item key="0">
					<base-setting></base-setting>
				</v-window-item>
				<v-window-item key="1" vertical>
					<game-setting></game-setting>
				</v-window-item>
				<v-window-item key="2" vertical>
					<resource-pack-setting></resource-pack-setting>
				</v-window-item>
			</v-window>
		</v-flex>
	</v-layout>
</template>

<script>
import GameSetting from './GameSetting';
import BaseSetting from './BaseSetting';
import ResourcePackSetting from './ResourcePackSetting';

export default {
  data: () => ({
    length: 3,
    window: 0,
    cooldown: false,
  }),
  components: {
    GameSetting,
    BaseSetting,
    ResourcePackSetting,
  },
  methods: {
    onScroll(e) {
      if (this.cooldown) return;
      const delta = Math.abs(e.deltaY);
      const sign = Math.sign(e.deltaY);
      if (delta > 50) {
        this.window += 1 * sign;
        if (this.window >= this.length) {
          this.window = 0;
        } else if (this.window < 0) {
          this.window = this.length - 1;
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
