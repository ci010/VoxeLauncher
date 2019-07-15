<template>
  <v-menu v-model="opened" bottom dark full-width max-height="300" :close-on-content-click="false"
          :disabled="disabled">
    <template v-slot:activator="{ on }">
      <slot :on="on" />
    </template>
    <v-text-field v-model="filterText" color="green" append-icon="filter_list" :label="$t('filter')"
                  solo dark hide-details>
      <template v-slot:prepend>
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-chip :color="showAlpha ? 'green': ''" icon dark label style="margin: 0px; height: 48px; border-radius: 0;"
                    @click="showAlpha = !showAlpha">
              <v-icon v-on="on">
                bug_report
              </v-icon>
            </v-chip>
          </template>
          {{ $t('version.showSnapshot') }}
        </v-tooltip>
      </template>
    </v-text-field>
    <minecraft-version-list :show-time="false" :filter="filter" style="max-height: 180px;" @value="selectVersion" />
  </v-menu>
</template>

<script>
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    // eslint-disable-next-line vue/prop-name-casing
    'extra-filter': {
      type: Function,
      default: () => true,
    },
  },
  data: () => ({
    opened: false,
    showAlpha: false,
    filterText: '',
  }),
  methods: {
    selectVersion(item) {
      this.$emit('value', item.id);
      this.opened = false;
    },
    filter(v) {
      if (!this.showAlpha && v.type !== 'release') return false;
      if (!this.extraFilter(v)) return false;
      return v.id.indexOf(this.filterText) !== -1;
    },
  },
};
</script>

<style>
.v-input__prepend-outer {
  margin-top: 0px !important;
  margin-right: 0px !important;
}
.v-input__slot {
  border-radius: 0 !important;
}
</style>
