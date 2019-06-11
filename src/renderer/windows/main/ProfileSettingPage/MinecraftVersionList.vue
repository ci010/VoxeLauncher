<template>
	<v-list style="max-height: 180px; overflow-y: scroll; scrollbar-width: 0;">
		<template v-for="(item, index) in versions">
			<v-list-tile ripple :key="index" @click="selectVersion(item)">
				<v-list-tile-title>
					{{ item }}
				</v-list-tile-title>
				<v-list-tile-action style="justify-content: flex-end;">
					<v-icon v-if="statuses[item] !== 'loading'">
						{{ statuses[item] === 'remote' ? 'cloud' : 'folder' }}
					</v-icon>
					<v-progress-circular v-else :width="2" :size="24" indeterminate></v-progress-circular>
				</v-list-tile-action>
			</v-list-tile>
		</template>
	</v-list>
</template>

<script>
export default {
  data: () => ({
    showAlpha: false,
    filterText: '',
  }),
  computed: {
    statuses() {
      return this.$repo.getters['minecraftStatuses'];
    },
    versions() {
      return this.$repo.state.version.minecraft.versions
        .filter(version => this.showAlpha || version.type === 'release')
        .filter(version => version.id.indexOf(this.filterText) !== -1)
        .map(version => version.id);
    },
  }
}
</script>

<style>
</style>
