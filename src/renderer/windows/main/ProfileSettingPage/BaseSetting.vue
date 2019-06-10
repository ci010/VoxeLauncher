<template>
	<v-form ref="form" v-model="valid" lazy-validation style="height: 100%;">
		<v-container grid-list-xs fill-height style="overflow: auto;">
			<v-layout row wrap>
				<v-flex tag="h1" style="margin-bottom: 10px;" class="white--text" xs12>
					<span class="headline">{{$t('settings')}}</span>
				</v-flex>
				<v-flex d-flex xs4>
					<v-text-field outline dark v-model="name" :label="$t('name')" :rules="nameRules" required></v-text-field>
				</v-flex>
				<v-flex d-flex xs4>
					<v-text-field outline dark v-model="author" :label="$t('author')" required></v-text-field>
				</v-flex>
				<v-flex d-flex xs4>
					<version-menu @value="mcversion = $event">
						<template v-slot="{ on }">
							<v-text-field style="cursor: pointer !important;" outline dark append-icon="arrow" v-model="mcversion"
							  :label="$t('minecraft.version')" :readonly="true" @click:append="on.keydown" v-on="on"></v-text-field>
						</template>
					</version-menu>
				</v-flex>
				<v-flex d-flex xs8>
					<v-text-field outline dark v-model="description" :label="$t('description')">
					</v-text-field>
				</v-flex>
				<v-flex d-flex xs4 class="local-version">
					<v-tooltip top>
						<template v-slot:activator="{ on }">
							<v-select v-on="on" hide-details dark outline :item-text="(v)=>v.id" :item-value="(v)=>v"
							  :label="$t('profile.localVersion')" v-model="localVersion" :items="localVersions"></v-select>
						</template>
						{{$t('profile.localVersionHint')}}
					</v-tooltip>
				</v-flex>
				<v-flex d-flex xs6>
					<v-select :item-text="regularText" :item-value="getJavaValue" outline dark prepend-inner-icon="add"
					  v-model="java" :label="$t('java.location')" :items="javas" required :menu-props="{ auto: true, overflowY: true }"
					  @click:prepend-inner="browseFile"></v-select>
				</v-flex>
				<v-flex d-flex xs3>
					<v-text-field outline dark type="number" v-model="minMemory" :label="$t('java.minMemory')"
					  required></v-text-field>
				</v-flex>
				<v-flex d-flex xs3>
					<v-text-field outline dark type="number" v-model="maxMemory" :label="$t('java.maxMemory')"
					  required></v-text-field>
				</v-flex>
				<v-flex d-flex xs6>
					<v-checkbox hide-details dark v-model="hideLauncher" :label="$t('launch.hideLauncher')"></v-checkbox>
				</v-flex>
				<v-flex d-flex xs6>
					<v-checkbox hide-details dark v-model="showLog" :label="$t('launch.showLog')"></v-checkbox>
				</v-flex>
			</v-layout>
		</v-container>
	</v-form>
</template>

<script>
import AbstractSetting from './AbstractSetting';

export default {
  mixins: [AbstractSetting],
  data: function () {
    return {
      valid: true,

      memoryRange: [256, 10240],

      javaValid: true,
      maxMemory: 1024,
      minMemory: 1024,
      java: { path: '', version: '' },
      memoryRule: [v => Number.isInteger(v)],
      hideLauncher: false,
      showLog: false,

      name: '',
      nameRules: [
        v => !!v || this.$t('profile.requireName'),
      ],
      author: '',
      description: '',
    }
  },
  computed: {
    mcversion: {
      get() { return this.$repo.getters['selectedProfile'].mcversion; },
      set(v) { this.$repo.dispatch('editProfile', { mcversion: v }); },
    },
    localVersion: {
      get() {
        const ver = this.$repo.getters.currentVersion;
        return this.localVersions.find(v => ver.id === v.id);
      },
      set(v) {
        const payload = {};
        console.log(v);
        if (v.minecraft !== this.mcversion) {
          this.mcversion = v.minecraft;
          payload.mcversion = this.mcversion;
        }
        const profile = this.$repo.getters['selectedProfile'];
        if (v.forge !== profile.forge.version) {
          payload.forge = {
            version: v.forge || '',
          }
        }
        this.$repo.dispatch('editProfile', payload);
      },
    },
    localVersions() {
      return this.$repo.state.version.local;
    },
    javas() {
      return this.$repo.state.java.all;
    },
    ready() {
      return this.valid && this.javaValid;
    },
    versions() {
      return Object.keys(this.$repo.state.version.minecraft.versions);
    },
  },
  methods: {
    save() {
      this.$repo.dispatch('editProfile', {
        name: this.name,
        author: this.author,
        description: this.description,
        mcversion: this.mcversion,
        minMemory: this.minMemory,
        maxMemory: this.maxMemory,
        java: this.java,
        showLog: this.showLog,
        hideLauncher: this.hideLauncher,
      });
    },
    load() {
      const profile = this.$repo.getters['selectedProfile'];
      this.name = profile.name;
      this.author = profile.author;
      this.description = profile.description;

      this.maxMemory = profile.maxMemory;
      this.minMemory = profile.minMemory;
      this.java = profile.java;

      this.hideLauncher = profile.hideLauncher;
      this.showLog = profile.showLog;
    },
    onNameInput(event) {
      if (!this.editingName) {
        event.preventDefault();
      }
    },
    browseFile() {
      this.$electron.remote.dialog.showOpenDialog({
        title: this.$t('java.browse'),
      }, (filePaths, bookmarks) => {
        filePaths.forEach((p) => {
          this.$repo.dispatch('resolveJava', p);
        });
      });
    },
    getJavaValue(java) {
      return java;
    },
    regularText(java) {
      const text = `v${java.version}: ${java.path}`
      if (text.length > 25) {
        return text.substring(0, 25) + '...'
      }
      return text;
    },
  }
}
</script>

<style scoped=true>
.flex {
  padding: 6px 8px !important;
}
</style>
<style>
.local-version .v-select__selection--comma {
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
