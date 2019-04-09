<template>
	<v-menu v-model="opened" bottom dark full-width max-height="300" :close-on-content-click="false">
		<template v-slot:activator="{ on }">
			<slot :on="on"></slot>
		</template>

		<v-text-field color="green" v-model="filterText" append-icon="filter_list" :label="$t('filter')" solo
		  dark hide-details>
			<template v-slot:prepend>
				<v-tooltip top>
					<template v-slot:activator="{ on }">
						<v-chip :color="showAlpha ? 'green': ''" @click="showAlpha = !showAlpha" icon dark label
						  style="margin: 0px; height: 48px; border-radius: 0;">
							<v-icon v-on="on">bug_report</v-icon>
						</v-chip>
					</template>
					{{$t('version.showSnapshot')}}
				</v-tooltip>
			</template>
		</v-text-field>
		<v-list style="max-height: 180px; overflow-y: scroll; scrollbar-width: 0;">
			<template v-for="(item, index) in versions">
				<v-list-tile ripple :key="index" @click="selectVersion(item)">
					<v-list-tile-title>
						{{ item }}
					</v-list-tile-title>
				</v-list-tile>
			</template>
		</v-list>
	</v-menu>
</template>

<script>
export default {
  data: () => ({
    opened: false,
    showAlpha: false,
    filterText: '',
  }),
  computed: {
    versions() {
      const versions = this.$repo.state.versions.minecraft.versions;
      return Object.keys(versions)
        .filter(version => this.showAlpha || versions[version].type === 'release')
        .filter(version => version.indexOf(this.filterText) !== -1);
    },
  },
  methods: {
    selectVersion(item) {
      this.$emit('value', item);
      this.opened = false;
    },
  },
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
