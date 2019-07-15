<template>
  <v-container grid-list-xs fill-height>
    <v-layout row wrap>
      <v-flex tag="h1" style="margin-bottom: 10px;" class="white--text" xs6>
        <span class="headline">{{ $t('profile.versionSetting') }}</span>
      </v-flex>
      <v-flex xs6 style="margin-top: 10px;">
        <v-layout row align-end justify-end>
          <v-spacer />
          <v-chip color="primary" label dark outline style="transition: transform 1s;">
            Minecraft:  {{ mcversion }}
          </v-chip>
          <v-expand-x-transition>
            <v-chip v-show="forgeVersion !== ''" color="brown" label dark outline style="white-space: nowrap">
              Forge:
              {{ forgeVersion }}
            </v-chip>
          </v-expand-x-transition>
        </v-layout>
      </v-flex>
      <v-flex xs12>
        <v-tabs v-model="active" mandatory color="transparent" dark :slider-color="barColor">
          <v-tab>
            {{ $t('version.locals') }}
          </v-tab>
          <v-tab>
            Minecraft
          </v-tab>
          <v-tab @click="refreshForgeVersion(false)">
            Forge
          </v-tab>
          <v-tab>
            Liteloader
          </v-tab>
        </v-tabs>
        <search-bar @input="filterText=$event" />
        <v-tabs-items v-model="active" color="transparent" dark slider-color="primary" style="height: 70vh; overflow-y: auto"
                      @mousewheel="onMouseWheel">
          <v-tab-item style="height: 100%" @mousewheel="onMouseWheel">
            <local-version-list :filter-text="filterText" :selected="localVersion" @value="selectLocalVersion" />
          </v-tab-item>
          <v-tab-item style="height: 100%" @mousewheel="onMouseWheel">
            <v-list-tile style="margin: 0px 0;">
              <v-checkbox v-model="showAlpha" :label="$t('minecraft.showAlpha')" />
            </v-list-tile>
            <v-divider dark />

            <minecraft-version-list :filter="filterMinecraft" style="background-color: transparent;"
                                    :mcversion="mcversion" :selected="mcversion" @value="mcversion = $event.id" />
          </v-tab-item>
          <v-tab-item style="height: 100%" @mousewheel="onMouseWheel">
            <v-list-tile>
              <v-checkbox v-model="recommendedAndLatestOnly" :label="$t('forge.recommendedAndLatestOnly')" />
              <v-spacer />
              <v-checkbox v-model="showBuggy" :label="$t('forge.showBuggy')" />
            </v-list-tile>
            <v-divider dark />
            <forge-version-list style="background-color: transparent" :refreshing="$repo.state.version.refreshingForge" :version-list="forgeVersionList"
                                :mcversion="mcversion" :filter="filterForge" @refresh="refreshForgeVersion(true)" @value="forgeVersion = $event ? $event.version : ''" />
          </v-tab-item>
          <v-tab-item style="height: 100%" @mousewheel="onMouseWheel">
            <liteloader-version-list :mcversion="mcversion" :filter-text="filterText" @value="liteloaderVersion = $event ? $event.version : ''" />
          </v-tab-item>
        </v-tabs-items>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  mixins: [],
  data() {
    return {
      active: 0,
      searchPanel: false,
      filterText: '',

      showAlpha: false,

      showBuggy: false,
      recommendedAndLatestOnly: true,

      mcversion: '',
      forgeVersion: '',
      liteloaderVersion: '',

      forgeVersionList: [],
    };
  },
  computed: {
    barColor() {
      switch (this.active) {
        case 0: return 'white';
        case 1: return 'primary';
        case 2: return 'brown';
        case 3: return 'cyan';
        default: return 'primary';
      }
    },
    localVersion() { return { minecraft: this.mcversion, forge: this.forgeVersion, liteloader: this.liteloaderVersion }; },
    profile() { return this.$repo.getters.selectedProfile; },
  },
  watch: {
    mcversion() {
      this.forgeVersion = '';
      this.liteloaderVersion = '';
    },
  },
  mounted() { this.load(); },
  destroyed() { this.save(); },
  activated() { this.load(); },
  deactivated() { this.save(); },
  methods: {
    save() {
      this.$repo.dispatch('editProfile', {
        mcversion: this.mcversion,
        forge: {
          version: this.forgeVersion,
        },
      });
    },
    load() {
      const profile = this.$repo.getters.selectedProfile;
      this.mcversion = profile.mcversion;
      this.forgeVersion = profile.forge.version;

      const mcversion = this.mcversion;
      const ver = this.$repo.state.version.forge[mcversion];
      if (ver) {
        this.forgeVersionList = ver.versions;
      } else {
        this.forgeVersionList = [];
        this.$repo.dispatch('getForgeWebPage', this.mcversion)
          .then(r => (r ? r.versions : []))
          .then((r) => { this.forgeVersionList = [...r]; });
      }
    },
    onMouseWheel(e) {
      e.stopPropagation();
      return false;
    },
    async refreshForgeVersion(force) {
      if (force || this.mcversion !== this.profile.mcversion) {
        this.forgeVersionList = [];
        let r;
        if (force) {
          await this.$repo.dispatch('refreshForge', this.mcversion);
          r = this.$repo.state.version.forge[this.mcversion];
        } else {
          r = await this.$repo.dispatch('getForgeWebPage', this.mcversion);
        }
        await this.$nextTick();
        this.forgeVersionList = r ? Object.freeze([...r.versions]) : Object.freeze([]);
      }
    },
    filterMinecraft(v) {
      if (!this.showAlpha && v.type !== 'release') return false;
      return v.id.indexOf(this.filterText) !== -1;
    },
    filterForge(version) {
      if (this.recommendedAndLatestOnly && version.type !== 'recommended' && version.type !== 'latest') return false;
      if (this.showBuggy && version.type !== 'buggy') return true;
      return version.version.indexOf(this.filterText) !== -1;
    },
    selectLocalVersion(v) {
      this.mcversion = v.minecraft;
      this.$nextTick().then(() => {
        this.forgeVersion = v.forge;
        this.liteloaderVersion = v.liteloader;
      });
    },
    onKeyPress(e) {
      console.log(e.code);
    },
  },
};
</script>

<style scoped=true>
.flex {
  padding: 6px 8px !important;
}
</style>
