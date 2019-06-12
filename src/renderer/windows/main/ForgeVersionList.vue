<template>
	<v-list dark style="overflow-y: scroll; scrollbar-width: 0;">
		<v-list-tile ripple @click="selectVersion(null)">
			<v-list-tile-title>
				{{$t('forge.disable')}}
			</v-list-tile-title>
		</v-list-tile>
		<template v-for="(item, index) in versions">
			<v-list-tile ripple :key="index" @click="selectVersion(item)">
				<v-list-tile-title>
					<v-icon v-if="iconMapping[item.type]">{{iconMapping[item.type]}}</v-icon>
					{{ item.version }}
					<span style="color: grey; font-size: 14px; font-style: italic;">
						{{item.date}}
					</span>
				</v-list-tile-title>
				<v-list-tile-action style="justify-content: flex-end;">
					<v-icon v-if="statuses[item.version] !== 'loading'">
						{{ statuses[item.version] === 'remote' ? 'cloud_download' : 'folder' }}
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
    iconMapping: {
      buggy: 'bug_report',
      recommended: 'star_rate',
      latest: 'fiber_new'
    }
  }),
  props: {
    showBuggy: {
      type: Boolean,
      default: false,
    },
    filterText: {
      type: String,
      default: '',
    },
  },
  computed: {
    statuses() {
      return this.$repo.getters['forgeStatuses'];
    },
    versions() {
      const mcversion = this.$repo.getters['currentVersion'].minecraft;
      const ver = this.$repo.getters.forgeVersionsOf(mcversion);
      let result = [];
      if (ver) {
        result = ver.versions
          .filter(version => this.showBuggy || version.type !== 'buggy')
          .filter(version => version.version.indexOf(this.filterText) !== -1);
      }
      return result;
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
