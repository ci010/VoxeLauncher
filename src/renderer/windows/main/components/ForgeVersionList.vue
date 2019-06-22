<template>
	<v-container v-if="refreshing" fill-height>
		<v-layout align-center justify-center row fill-height>
			<v-flex shrink>
				<v-progress-circular :size="100" color="white" indeterminate></v-progress-circular>
			</v-flex>
		</v-layout>
	</v-container>
	<v-list v-else-if="versionList.length !== 0" dark style="overflow-y: scroll; scrollbar-width: 0;">
		<v-list-tile ripple @click="selectVersion(null)">
			<v-list-tile-avatar>
				<v-icon> close </v-icon>
			</v-list-tile-avatar>
			{{$t('forge.disable')}}
		</v-list-tile>
		<template v-for="(item, index) in versions">
			<v-list-tile ripple :key="index" @click="selectVersion(item)">
				<v-list-tile-avatar>
					<v-icon v-if="statuses[index] !== 'loading'">
						{{ statuses[index] === 'remote' ? 'cloud_download' : 'folder' }}
					</v-icon>
					<v-progress-circular v-else :width="2" :size="24" indeterminate></v-progress-circular>
				</v-list-tile-avatar>

				<v-list-tile-title>
					{{ item.version }}
				</v-list-tile-title>
				<v-list-tile-sub-title v-html="item.date"></v-list-tile-sub-title>

				<v-list-tile-action style="justify-content: flex-end;">
					<v-chip label v-if="item.type !== 'common'" :color="item.type === 'recommended'?'green': ''">
						{{item.type}}
					</v-chip>
					<!-- <v-icon v-if="iconMapping[item.type]">{{iconMapping[item.type]}}</v-icon> -->
				</v-list-tile-action>
			</v-list-tile>
		</template>
	</v-list>
	<v-container v-else fill-height>
		<v-layout align-center justify-center row fill-height>
			<v-flex shrink tag="h3" class="white--text">
				<v-btn outline large @click="$emit('refresh')">
					<v-icon left> refresh </v-icon>
					{{$t('forge.noVersion', {version:mcversion})}}
				</v-btn>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
export default {
  data: () => ({
    iconMapping: {
      buggy: 'bug_report',
      recommended: 'star',
      latest: 'fiber_new'
    },
  }),
  props: {
    mcversion: {
      type: String,
      default: '',
    },
    refreshing: {
      type: Boolean,
      default: false,
    },
    versionList: {
      type: Array,
      default: [],
    },
    filter: {
      type: Function,
      default: () => true,
    },
  },
  computed: {
    statuses() {
      return this.$repo.getters['forgeStatuses'];
    },
    versions() {
      return this.versionList.filter(this.filter);
    },
  },
  methods: {
    selectVersion(item) {
      this.$emit('value', item);
    },
  },
}
</script>

<style>
</style>
