<template>
	<v-menu v-model="opened" bottom dark full-width max-height="300" :close-on-content-click="false"
	  :disabled="disabled" style="background-color: #303030">
		<template v-slot:activator="{ on }">
			<slot :on="on"></slot>
		</template>
		<v-text-field color="green" v-model="filterText" append-icon="filter_list" :label="$t('filter')"
		  solo dark hide-details>
			<template v-slot:prepend>
				<v-tooltip top>
					<template v-slot:activator="{ on }">
						<v-chip :color="recommendedAndLatestOnly ? 'green': ''" @click="recommendedAndLatestOnly = !recommendedAndLatestOnly"
						  icon dark label style="margin: 0px; height: 48px; border-radius: 0;">
							<v-icon v-on="on">bug_report</v-icon>
						</v-chip>
					</template>
					{{$t('version.showSnapshot')}}
				</v-tooltip>
			</template>
		</v-text-field>
		<forge-version-list :mcversion="mcversion" :versionList="versions" @value="selectVersion" style="max-height: 180px;"></forge-version-list>
	</v-menu>
</template>

<script>
export default {
  data: () => ({
    opened: false,
    showBuggy: false,
    recommendedAndLatestOnly: true,
    filterText: '',

    versions: [],
  }),
  watch: {
    opend() {
      console.log(this.opened);
      if (this.opened) {
        this.refresh();
      }
    }
  },
  mounted() {
    this.refresh();
  },
  methods: {
    refresh() {
      if (!this.mcversion) return;

      const ver = this.$repo.state.version.forge[this.mcversion];
      if (ver) {
        this.versions = ver.versions.filter(this.filterForge);
      } else {
        this.$repo.dispatch('getForgeWebPage', this.mcversion)
          .then((r) => r ? r.versions : [])
          .then(r => { this.versions = r.filter(this.filterForge); });
      }
    },
    selectVersion(item) {
      console.log(item);
      this.$emit('value', item);
      this.opened = false;
    },
    filterForge(version) {
      if (this.recommendedAndLatestOnly && version.type !== 'recommended' && version.type !== 'latest') return false;
      if (this.showBuggy && version.type !== 'buggy') return true;
      return version.version.indexOf(this.filterText) !== -1;
    },
  },
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    mcversion: {
      type: String,
      default: undefined,
    },
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