<template>
  <v-list v-if="fullVersionList.length !== 0" dark style="overflow-y: scroll; scrollbar-width: 0; background-color: transparent;">
    <v-list-tile ripple @click="selectVersion(null)">
      <v-list-tile-avatar>
        <v-icon> close </v-icon>
      </v-list-tile-avatar>
      {{ $t('liteloader.disable') }}
    </v-list-tile>
    <template v-for="(item, index) in versions">
      <v-list-tile :key="index" ripple @click="selectVersion(item)">
        <v-list-tile-avatar>
          <v-icon v-if="statuses[index] !== 'loading'">
            {{ statuses[index] === 'remote' ? 'cloud_download' : 'folder' }}
          </v-icon>
          <v-progress-circular v-else :width="2" :size="24" indeterminate />
        </v-list-tile-avatar>

        <v-list-tile-title>
          {{ item.version }}
        </v-list-tile-title>
        <v-list-tile-sub-title>
          {{ item.date }}
        </v-list-tile-sub-title>

        <v-list-tile-action style="justify-content: flex-end;">
          <v-chip v-if="item.type !== 'common'" label :color="item.type === 'recommended'?'green': ''">
            {{ item.type }}
          </v-chip>
          <!-- <v-icon v-if="iconMapping[item.type]">{{iconMapping[item.type]}}</v-icon> -->
        </v-list-tile-action>
      </v-list-tile>
    </template>
  </v-list>
  <v-container v-else fill-height>
    <v-layout align-center justify-center row fill-height>
      <v-flex shrink tag="h3" class="white--text">
        <v-btn large>
          <v-icon left>
            refresh
          </v-icon>
          {{ $t('liteloader.noVersion', {version:mcversion}) }}
        </v-btn>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  props: {
    filterText: {
      type: String,
      default: '',
    },
    mcversion: {
      type: String,
      default: undefined,
    },
  },
  data: () => ({
  }),
  computed: {
    statuses() {
      return this.$repo.getters.liteloaderStatus;
    },
    fullVersionList() {
      const mcversion = this.mcversion || this.$repo.getters.currentVersion.minecraft;
      const ver = this.$repo.state.version.liteloader.versions[mcversion];
      return ver ? ver.versions : [];
    },
    versions() {
      return this.fullVersionList.filter(version => version.version.indexOf(this.filterText) !== -1);
    },
  },
  methods: {
    selectVersion(item) {
      this.$emit('value', item);
    },
  },

};
</script>

<style>
</style>
