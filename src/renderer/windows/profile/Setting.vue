<template>
	<v-form ref="form" v-model="valid" lazy-validation style="max-width: 640px; height: 100%;">
		<v-container style="height: 100%; max-height: 100%">
			<v-flex tag="h1" style="margin-bottom: 10px;" class="white--text" xs12 align-end flexbox>
				<span class="headline">{{$t('settings')}}</span>
			</v-flex>
			<v-layout align-space-around justify-space-between row>
				<v-flex>
					<v-text-field outline dark v-model="name" :label="$t('name')" :rules="nameRules"
					  required></v-text-field>
				</v-flex>

				<v-flex>
					<v-text-field outline dark v-model="author" :label="$t('author')" required></v-text-field>
				</v-flex>

				<v-flex>
					<version-menu>
						<template v-slot="{ on }">
							<v-text-field outline dark append-icon="arrow" v-model="mcversion" :label="$t('minecraft.version')"
							  :readonly="true" @click:append="on.keydown" v-on="on" @value="mcversion = $event"></v-text-field>
						</template>
					</version-menu>
				</v-flex>
			</v-layout>
			<v-flex>
				<v-text-field outline dark v-model="description" :label="$t('description')">
				</v-text-field>
			</v-flex>

			<v-layout align-space-around justify-space-between row>
				<v-flex xs6>
					<v-select :item-text="regularText" outline dark prepend-inner-icon="add" v-model="java"
					  :label="$t('java.location')" :items="javas" required :menu-props="{ auto: true, overflowY: true }"
					  @click:prepend-inner="browseFile"></v-select>
				</v-flex>
				<v-flex xs3>
					<v-text-field outline dark v-model="minMemory" :label="$t('java.minMemory')"
					  required></v-text-field>
				</v-flex>
				<v-flex xs3>
					<v-text-field outline dark v-model="maxMemory" :label="$t('java.maxMemory')"
					  required></v-text-field>
				</v-flex>
			</v-layout>
			<v-layout align-space-around justify-space-between row>
				<v-flex>
					<v-checkbox hide-details dark v-model="hideLauncher" :label="$t('launch.hideLauncher')"></v-checkbox>
				</v-flex>
        <v-flex>
					<v-checkbox hide-details dark v-model="showLog" :label="$t('launch.showLog')"></v-checkbox>
        </v-flex>
			</v-layout>

			<v-layout column>
				<v-flex>
				</v-flex>
				<v-spacer></v-spacer>
				<v-flex>
					<v-layout align-end justify-space-between row>
						<v-btn dark outline @click="goBack">
							{{$t('cancel')}}
						</v-btn>

						<v-btn color="primary" dark outline @click="submit">
							{{$t('save')}}
						</v-btn>
					</v-layout>
				</v-flex>
			</v-layout>
		</v-container>
	</v-form>
</template>

<script>
export default {
  data: () => ({
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
      v => !!v || 'Name is required',
      v => (v && v.length <= 10) || 'Name must be less than 10 characters'
    ],
    author: '',
    description: 'No description',
  }),
  computed: {
    javas() {
      return this.$repo.state.java.all;
    },
    ready() {
      return this.valid && this.javaValid;
    },
    versions() {
      return Object.keys(this.$repo.state.versions.minecraft.versions);
    },
    profile() {
      return this.$repo.getters['profile/current'];
    }
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
  methods: {
    onNameInput(event) {
      if (!this.editingName) {
        event.preventDefault();
      }
    },
    goBack() {
      this.$router.replace('/');
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
    submit() {
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
      this.$router.replace('/');
    },
    regularText(java) {
      const text = `v${java.version}: ${java.path}`
      if (text.length > 60) {
        return text.substring(0, 57) + '...'
      }
      return text;
    },
  }
}
</script>

<style>
</style>
