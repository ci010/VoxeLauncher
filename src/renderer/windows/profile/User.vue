<template>
	<v-container fluid grid-list-md>
		<v-layout row fill-height>
			<v-flex shrink>
				<v-layout column wrap>
					<v-flex d-flex xs4>
						<v-card dark>
							<skin-view :data="skin"></skin-view>
						</v-card>
					</v-flex>
					<v-flex d-flex xs4>
						<v-layout column>
							<v-btn dark block>
								{{$t('skin.change')}}
								<v-icon right dark>accessibility_new</v-icon>
							</v-btn>
							<v-btn dark block>
								{{$t('skin.reset')}}
								<v-icon right dark>undo</v-icon>
							</v-btn>
							<v-btn dark block>
								{{$t('skin.reset')}}
								<v-icon right dark>cloud_upload</v-icon>
							</v-btn>
						</v-layout>
					</v-flex>
				</v-layout>
			</v-flex>
			<v-flex grow>
				<v-layout column fill-height ml-1>
					<v-flex d-flex xs6>
						<v-layout column justify-start>
							<v-flex xs1>
								<v-text-field hide-details :label="$t('user.name')" readonly :value="username" color="primary"
								  dark outline append-icon="file_copy" @click:append="$copy(username)">
								</v-text-field>
							</v-flex>
							<v-flex xs1>
								<v-text-field hide-details :label="$t('user.accessToken')" readonly :value="accessToken"
								  color="primary" dark outline append-icon="file_copy" @click:append="$copy(accessToken)">
								</v-text-field>
							</v-flex>
							<v-flex xs1>
								<v-select hide-details :label="$t('user.authService')" readonly :value="authMode" :items="authServices"
								  color="primary" dark outline></v-select>
							</v-flex>
							<v-flex xs1>
								<v-select hide-details :label="$t('user.profileService')" :items="profileServices" :value="profileMode"
								  color="primary" dark outline prepend-inner-icon="add"></v-select>
							</v-flex>
						</v-layout>
					</v-flex>
					<v-flex d-flex xs6>
						<v-layout column justify-end="">
							<v-flex xs2>
								<v-btn block color="primary">{{$t('user.switchAccount')}}</v-btn>
								<v-btn block dark color="red">{{$t('user.logout')}}</v-btn>
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
  }
}
</script>

<style>
</style>
