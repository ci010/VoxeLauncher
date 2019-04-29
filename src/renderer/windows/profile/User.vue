<template>
	<v-container fluid grid-list-md fill-height>
		<v-layout row fill-height>
			<v-flex shrink>
				<v-layout justify-center align-center fill-height>
					<v-flex style="z-index: 10;">
						<skin-view :data="skin"></skin-view>
					</v-flex>
				</v-layout>
			</v-flex>
			<v-flex grow>
				<v-layout column fill-height>
					<v-flex d-flex grow>
						<v-layout column justify-start>
							<v-flex tag="h1" class="white--text" xs1 style="margin-bottom: 10px; padding: 6px; 8px;">
								<span class="headline">{{$tc('user', 2)}}</span>
							</v-flex>
							<v-flex xs1>
								<v-text-field hide-details :label="$t('user.name')" readonly :value="username" color="primary"
								  dark append-icon="file_copy" @click:append="$copy(username)">
								</v-text-field>
							</v-flex>
							<v-flex xs1>
								<v-text-field hide-details :label="$t('user.accessToken')" readonly :value="accessToken"
								  color="primary" dark append-icon="file_copy" @click:append="$copy(accessToken)">
								</v-text-field>
							</v-flex>
							<v-flex xs1>
								<v-select hide-details :label="$t('user.authService')" readonly :value="authMode" :items="authServices"
								  color="primary" dark prepend-inner-icon="add"></v-select>
							</v-flex>
							<v-flex xs1>
								<v-select hide-details :label="$t('user.profileService')" :items="profileServices" :value="profileMode"
								  color="primary" dark prepend-inner-icon="add"></v-select>
							</v-flex>

						</v-layout>
					</v-flex>

					<v-flex d-flex shrink>
						<v-btn block dark>
							<v-icon left dark>accessibility_new</v-icon>
							{{$t('skin.change')}}
						</v-btn>
					</v-flex>
					<v-flex d-flex shrink>
						<v-layout wrap>
							<v-flex d-flex xs6>
								<v-btn block dark>
									<v-icon left dark>cloud_upload</v-icon>
									{{$t('skin.upload')}}
								</v-btn>
							</v-flex>
							<v-flex d-flex xs6>
								<v-btn block dark>
									<v-icon left dark>undo</v-icon>
									{{$t('skin.reset')}}
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
import defaultSkin from 'universal/defaultSkin';

export default {
  data: () => ({
    defaultSkin,
  }),
  computed: {
    accessToken() { return this.$repo.state.user.accessToken; },
    authMode() { return this.$repo.state.user.authMode; },
    profileMode() { return this.$repo.state.user.profileMode; },
    authServices() { return this.$repo.getters['user/authModes'] },
    profileServices() { return this.$repo.getters['user/profileModes'] },
    username() {
      return this.$repo.state.user.name;
    },
    skin() {
      const skin = this.$repo.state.user.skin;
      return skin.data === '' ? this.defaultSkin : this.$repo.state.user.skin.data;
    },
  },
  mounted() {
  },
  components: {
    SkinView: () => import('../../skin/SkinView'),
  },
  methods: {
    doSwitchAccount() {
			this.$router.replace('/login');
    },
    doLogout() {
			this.$router.replace('/login');
    }
  }
}
</script>

<style>
</style>
