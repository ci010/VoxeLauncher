<template>
	<v-list dark style="overflow-y: scroll; scrollbar-width: 0; background-color: transparent;"
	  @mousewheel="onMouseWheel">
		<v-list-tile style="margin: 0px 0;">
			<v-checkbox v-model="showAlpha" :label="$t('minecraft.showAlpha')"></v-checkbox>
		</v-list-tile>
		<v-divider dark></v-divider>

		<template v-for="(item, index) in versions">
			<!-- <v-divider dark :key="`L${index}`"></v-divider> -->
			<v-list-tile ripple :key="index" @click="selectVersion(item)" style="margin: 0px 0;">
				<v-list-tile-avatar>
					<v-icon v-if="statuses[item.id] !== 'loading'">
						{{ statuses[item.id] === 'remote' ? 'cloud' : 'folder' }}
					</v-icon>
					<v-progress-circular v-else :width="2" :size="24" indeterminate></v-progress-circular>
				</v-list-tile-avatar>

				<v-list-tile-title>
					{{ item.id }}
				</v-list-tile-title>
				<v-list-tile-sub-title v-html="item.releaseTime"></v-list-tile-sub-title>

				<v-list-tile-action style="justify-content: flex-end;">
					<v-chip :color="item.type === 'release' ? 'primary' : '' " label dark>
						{{item.type}}
					</v-chip>
				</v-list-tile-action>
			</v-list-tile>
		</template>
	</v-list>
</template>

<script>
export default {
  data() {
    return { showAlpha: false };
  },
  props: {
    filterText: {
      type: String,
      default: '',
    },
  },
  computed: {
    statuses() {
      return this.$repo.getters['minecraftStatuses'];
    },
    versions() {
      return this.$repo.state.version.minecraft.versions
        .filter(version => this.showAlpha || version.type === 'release')
        .filter(version => version.id.indexOf(this.filterText) !== -1)
        .map(version => version);
    },
  },
  methods: {
    onMouseWheel(e) {
      e.stopPropagation();
      return true;
    },
    selectVersion(v) {
      this.$emit('value', v);
    },
  }
}
</script>

<style>
</style>
