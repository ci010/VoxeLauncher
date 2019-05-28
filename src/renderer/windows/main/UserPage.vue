<template>
	<v-container fluid grid-list-md fill-height>
		<v-speed-dial v-model="fab" style="position:absolute; z-index: 20; bottom: 80px; left: 85px;"
		  direction="top" :open-on-hover="true">
			<template v-slot:activator>
				<v-btn v-model="fab" fab @click="doLoadSkin">
					<v-icon>edit</v-icon>
				</v-btn>
			</template>
			<v-btn fab small>
				<v-icon>link</v-icon>
			</v-btn>
			<v-btn fab small @click="doSaveSkin">
				<v-icon>save</v-icon>
			</v-btn>
		</v-speed-dial>

		<v-fab-transition>
			<v-btn v-show="modified" fab small absolute style="bottom: 100px; left: 45px; z-index: 20;"
			  @click="doReset">
				<v-icon>clear</v-icon>
			</v-btn>
		</v-fab-transition>
		<v-fab-transition>
			<v-btn v-show="modified" fab small absolute style="bottom: 100px; left: 157px; z-index: 20;"
			  @click="doUpload">
				<v-icon>check</v-icon>
			</v-btn>
		</v-fab-transition>

		<v-layout row fill-height>
			<v-flex shrink>
				<v-layout justify-center align-center fill-height>
					<v-flex style="z-index: 10;">
						<skin-view :data="skin.data" :slim="skin.slim" @drop="onDropSkin" @dragover="onDragOver"></skin-view>
					</v-flex>

				</v-layout>
			</v-flex>
			<v-flex grow>
				<v-layout column fill-height>
					<v-flex d-flex grow>
						<v-layout column justify-start>
							<v-flex tag="h1" class="white--text" xs1 style="margin-bottom: 10px; padding: 6px; 8px;">
								<span class="headline">{{$t('user.info')}}</span>
							</v-flex>
							<v-flex xs1>
								<v-text-field hide-details :label="$t('user.name')" readonly :value="user.name" color="primary"
								  dark append-icon="file_copy" @click:append="$copy(user.name)">
								</v-text-field>
							</v-flex>
							<v-flex xs1>
								<v-text-field hide-details :label="$t('user.accessToken')" readonly :value="user.accessToken"
								  color="primary" dark append-icon="file_copy" @click:append="$copy(user.accessToken)">
								</v-text-field>
							</v-flex>
							<v-flex xs1>
								<v-select hide-details :label="$t('user.authService')" readonly :value="user.authMode"
								  :items="authServices" color="primary" dark prepend-inner-icon="add"></v-select>
							</v-flex>
							<v-flex xs1>
								<v-select hide-details :label="$t('user.profileService')" :items="profileServices" :value="user.profileMode"
								  color="primary" dark prepend-inner-icon="add"></v-select>
							</v-flex>

							<v-flex xs1>
								<v-select hide-details :label="$t('user.skinSlim')" :items="[{text:'Alex', value:true}, {text:'Steve', value:false}]"
								  item-text="text" item-value="value" v-model="skin.slim" color="primary" dark></v-select>
							</v-flex>
						</v-layout>
					</v-flex>

					<v-flex d-flex shrink>
						<v-layout wrap>
							<v-flex d-flex xs6>
								<v-btn block dark @click="refreshSkin">
									<v-icon left dark>refresh</v-icon>
									{{$t('user.refreshSkin')}}
								</v-btn>
							</v-flex>
							<v-flex d-flex xs6>
								<v-btn block dark @click="refreshAccount">
									<v-icon left dark>refresh</v-icon>
									{{$t('user.refreshAccount')}}
								</v-btn>
							</v-flex>
						</v-layout>
					</v-flex>
					<v-flex d-flex shrink>
						<v-layout wrap>
							<v-flex d-flex xs6>
								<v-btn block @click="doSwitchAccount">
									<v-icon left dark>compare_arrows</v-icon>
									{{$t('user.switchAccount')}}
								</v-btn>
							</v-flex>
							<v-flex d-flex xs6>
								<v-btn block dark color="red" @click="doLogout">
									<v-icon left dark>exit_to_app</v-icon>
									{{$t('user.logout')}}
								</v-btn>
							</v-flex>
						</v-layout>
					</v-flex>
				</v-layout>
			</v-flex>

		</v-layout>
	</v-container>
</template>

<script>
export default {
  data: () => ({
    fab: false,
    skin: {
      data: '',
      slim: false,
    },
  }),
  computed: {
    offline() { return this.user.authMode === 'offline'; },
    user() { return this.$repo.state.user; },
    authServices() { return this.$repo.getters['user/authModes'] },
    profileServices() { return this.$repo.getters['user/profileModes'] },
    modified() {
      const skin = this.$repo.state.user.skin;
      return skin.data !== this.skin.data || this.skin.slim !== skin.slim;
    }
  },
  mounted() {
    this.doReset();
  },
  methods: {
    doSwitchAccount() {
      this.$router.replace('/login');
    },
    doLogout() {
      this.$repo.dispatch('user/logout')
        .then(() => {
          this.$router.replace('/login');
        });
    },
    refreshSkin() {
      this.$repo.dispatch('user/refreshSkin');
      this.doReset();
    },
    refreshAccount() {
      this.$repo.dispatch('user/refreshInfo');
    },
    onDragOver(e) {
      e.preventDefault();
      return false;
    },
    onDropSkin(e) {
      e.preventDefault();

      const length = e.dataTransfer.files.length;
      if (length > 0) {
        console.log(`Detect drop import ${length} file(s).`);
        for (let i = 0; i < length; ++i) {
          // TOOD: use resource module to manage skin
          this.$repo.dispatch('user/parseSkin', e.dataTransfer.files[i].path).then((skin) => {
            if (skin) {
              this.skin.data = skin;
            }
          })
        }
      }
    },
    doLoadSkin() {
      this.$electron.remote.dialog.showOpenDialog({ title: 'Open your skin', filters: [{ extensions: ['png'], name: 'PNG Images' }] }, (filename, bookmark) => {
        if (filename && filename[0]) {
          this.$repo.dispatch('user/parseSkin', filename[0]).then((skin) => {
            if (skin) {
              this.skin.data = skin;
            }
          })
        }
      })
    },
    doReset() {
      const skin = this.$repo.state.user.skin;
      this.skin.data = skin.data;
      this.skin.slim = skin.slim;
    },
    doUpload() {
      if (this.offline) {
      } else {
        this.$repo.dispatch('user/uploadSkin', this.skin);
      }
    },
    doSaveSkin() {
      this.$electron.remote.dialog.showSaveDialog({ title: 'Save your skin', defaultPath: `${this.user.name}.png`, filters: [{ extensions: ['png'], name: 'PNG Images' }] }, (filename, bookmark) => {
        if (filename) {
          this.$repo.dispatch('user/saveSkin', { path: filename, skin: this.skin });
        }
      })
    },
  }
}
</script>

<style scoped=true>
</style>
