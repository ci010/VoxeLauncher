<template>
	<v-container fill-height>
		<v-layout align-center justify-center column fill-height>
			<v-flex>
				<div class="display-1 white--text">
					{{username}}
				</div>
			</v-flex>
			<v-flex>
				<v-card dark>
					<skin-view :data="skin"></skin-view>
				</v-card>
			</v-flex>
			<v-flex>
				<v-btn outline color="primary">Switch Account</v-btn>
			</v-flex>
			<v-flex>
				<v-btn outline color="red">Logout</v-btn>
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
