<template>
	<v-container grid-list-xs fill-height>
		<v-layout row wrap>
			<v-flex tag="h1" style="margin-bottom: 10px;" class="white--text" xs6>
				<span class="headline">{{$t('profile.versionSetting')}}</span>
			</v-flex>
			<v-flex xs6 style="margin-top: 10px;">
				<v-layout row align-end justify-end>
					<v-spacer></v-spacer>
					<v-chip label dark outline style="transition: transform 1s;"> Minecraft: {{mcversion}}
					</v-chip>
					<v-expand-x-transition>
						<v-chip label dark outline style="white-space: nowrap" v-show="forgeVersion !== ''"> Forge:
							{{forgeVersion}}
						</v-chip>
					</v-expand-x-transition>
				</v-layout>
			</v-flex>
			<v-flex xs12>
				<v-tabs v-model="active" mandatory color="transparent" dark slider-color="primary">
					<v-tab>
						{{$t('version.locals')}}
					</v-tab>
					<v-tab>
						Minecraft
					</v-tab>
					<v-tab @click="refreshForgeVersion">
						Forge
					</v-tab>
					<v-tab>
						Liteloader
					</v-tab>
				</v-tabs>
				<search-bar></search-bar>
				<v-tabs-items v-model="active" color="transparent" dark slider-color="primary" style="height: 70vh; overflow-y: auto"
				  @mousewheel="onMouseWheel">

					<v-tab-item @mousewheel="onMouseWheel" style="height: 100%">
						<local-version-list :filterText="filterText" @value="selectLocalVersion"></local-version-list>
					</v-tab-item>
					<v-tab-item @mousewheel="onMouseWheel" style="height: 100%">
						<minecraft-version-list :mcversion="mcversion" :filterText="filterText" @value="mcversion = $event.id"></minecraft-version-list>
					</v-tab-item>
					<v-tab-item @mousewheel="onMouseWheel" style="height: 100%">
						<forge-version-list :refreshing="$repo.state.version.refreshingForge" :versionList="forgeVersionList"
						  @refresh="refreshForgeVersion" :mcversion="mcversion" :filterText="filterText" @value="forgeVersion = $event ? $event.version : ''"></forge-version-list>
					</v-tab-item>
					<v-tab-item @mousewheel="onMouseWheel" style="height: 100%">
						<liteloader-version-list :mcversion="mcversion" :filterText="filterText" @value="liteloaderVersion = $event ? $event.version : ''"></liteloader-version-list>
					</v-tab-item>
				</v-tabs-items>
			</v-flex>

		</v-layout>
	</v-container>
</template>

<script>
import AbstractSetting from '../mixin/AbstractSetting';

export default {
  mixins: [AbstractSetting],
  data() {
    return {
      active: 0,
      searchPanel: false,
      filterText: '',

      mcversion: '',
      forgeVersion: '',
      liteloaderVersion: '',

      forgeVersionList: [],
    };
  },
  computed: {
    profile() { return this.$repo.getters['selectedProfile']; },
  },
  watch: {
    mcversion() {
      this.forgeVersion = '';
      this.liteloaderVersion = '';
    },
  },
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
      const profile = this.$repo.getters['selectedProfile'];
      this.mcversion = profile.mcversion;
      this.forgeVersion = profile.forge.version;

      const mcversion = this.mcversion;
      const ver = this.$repo.state.version.forge[mcversion];
      if (ver) {
        this.forgeVersionList = ver.versions;
      } else {
        this.$repo.dispatch('getForgeWebPage', this.mcversion)
          .then((r) => r ? r.versions : [])
          .then(r => { this.forgeVersionList = r; });
      }
    },
    onMouseWheel(e) {
      e.stopPropagation();
      return false;
    },
    refreshForgeVersion() {
      if (this.mcversion !== this.profile.mcversion) {
        this.$repo.dispatch('getForgeWebPage', this.mcversion)
          .then((r) => r ? r.versions : [])
          .then((r) => { this.forgeVersionList = r; });
      }
    },

    selectLocalVersion(v) {
      this.mcversion = v.minecraft;
      this.$nextTick().then(() => {
        this.forgeVersion = v.forge;
        this.liteloaderVersion = v.liteloader;
      })
    },
    onKeyPress(e) {
      console.log(e.code)
    },
  },
}
</script>

<style scoped=true>
.flex {
  padding: 6px 8px !important;
}
.slide-x-transition {
}
.slide-x-transition {
}
</style>
