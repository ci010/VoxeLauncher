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
					<version-menu>
						<template v-slot="{ on }">
							<v-text-field outline dark append-icon="arrow" v-model="mcversion" :label="$t('minecraft.version')"
							  :readonly="true" @click:append="on.keydown" v-on="on" @value="mcversion = $event"></v-text-field>
						</template>
					</version-menu>
				</v-flex>
				<v-flex d-flex xs12>
					<v-text-field outline dark v-model="description" :label="$t('description')">
					</v-text-field>
				</v-flex>
				<v-flex d-flex xs6>
					<v-select :item-text="regularText" outline dark prepend-inner-icon="add" v-model="java" :label="$t('java.location')"
					  :items="javas" required :menu-props="{ auto: true, overflowY: true }" @click:prepend-inner="browseFile"></v-select>
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
export default {
  data: function () {
    return {
      valid: true,

      mcversion: '',
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
  mounted() {
    const profile = this.$repo.getters['profile/current'];
    this.name = profile.name;
    this.author = profile.author;
    this.description = profile.description;

    this.mcversion = profile.mcversion;
    this.maxMemory = profile.maxMemory;
    this.minMemory = profile.minMemory;
    this.java = profile.java;

    this.hideLauncher = profile.hideLauncher;
    this.showLog = profile.showLog;
  },
  destroyed() {
    this.$repo.commit('profile/edit', {
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
  methods: {
    onNameInput(event) {
      if (!this.editingName) {
        event.preventDefault();
      }
    },
    browseFile() {
      this.$electron.remote.dialog.showOpenDialog({
        title: 'Find a new Java location',
        properties: ['openFile'],
      }, (filePaths, bookmarks) => {
        this.$repo.dispatch('java/add', filePaths).then((suc) => {
          if (suc) {

          }
        })
      });
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