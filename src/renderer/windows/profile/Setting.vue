<template>
	<v-layout align-center fill-height>
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
					<profile-setting></profile-setting>
				</v-window-item>
				<v-window-item key="1">
					<game-setting></game-setting>
				</v-window-item>
				<v-window-item key="2">
				</v-window-item>
			</v-window>
		</v-flex>
	</v-layout>
</template>

<script>
import GameSetting from './GameSetting';
import ProfileSetting from './ProfileSetting';

export default {
  data: () => ({
    length: 3,
    window: 0
  }),
  components: {
    GameSetting, ProfileSetting
  },
}
</script>

<style>
</style>
