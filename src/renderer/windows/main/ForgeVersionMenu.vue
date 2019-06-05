<template>
	<v-menu v-model="opened" bottom dark full-width min-width="400" max-width="400" max-height="500"
	  :close-on-content-click="false" :disabled="disabled">
		<template v-slot:activator="{ on }">
			<slot :on="on"></slot>
		</template>

		<v-text-field color="green" v-model="filterText" append-icon="filter_list" :label="$t('filter')"
		  solo dark hide-details>
			<template v-slot:prepend>
				<v-tooltip top>
					<template v-slot:activator="{ on }">
						<v-chip :color="showBuggy ? 'green': ''" @click="showBuggy = !showBuggy" icon dark label
						  style="margin: 0px; height: 48px; border-radius: 0;">
							<v-icon v-on="on">bug_report</v-icon>
						</v-chip>
					</template>
					{{$t('forge.showBuggy')}}
				</v-tooltip>
			</template>
		</v-text-field>
		<v-list style="max-height: 250px; overflow-y: scroll; scrollbar-width: 0;">
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
	</v-menu>
</template>

<script>
export default {
  data: () => ({
    opened: false,
    showBuggy: false,
    filterText: '',
    iconMapping: {
      buggy: 'bug_report',
      recommended: 'star_rate',
      latest: 'fiber_new'
    }
  }),
  computed: {
    statuses() {
      return this.$repo.getters['version/forge/statuses'];
    },
    versions() {
      const mcversion = this.$repo.getters['profile/current'].mcversion;
      return this.$repo.getters['version/forge/versions'](mcversion).versions
        .filter(version => this.showBuggy || version.type !== 'buggy')
        .filter(version => version.version.indexOf(this.filterText) !== -1);
    },
  },
  methods: {
    selectVersion(item) {
      this.$emit('value', item);
      this.opened = false;
    },
  },
  props: {
    disabled: {
      type: Boolean,
      default: false,
    }
  }
}
</script>

<style>
.v-input__prepend-outer {
  margin-top: 0px !important;
  margin-right: 0px !important;
}
.v-input__slot {
  border-radius: 0 !important;
}
::-webkit-scrollbar {
  width: 0px; /* remove scrollbar space */
  background: transparent; /* optional: just make scrollbar invisible */
}
</style>