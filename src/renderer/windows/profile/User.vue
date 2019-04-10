<template>
	<v-container fluid grid-list-md>
		<v-layout align-start justify-center row fill-height>
			<v-flex>
				<v-layout row fill-height>
					<v-flex>
						<v-card dark>
							<skin-view :data="skin"></skin-view>
						</v-card>
						<v-flex>
							<v-btn dark block>
								Change Skin
								<v-icon right dark>accessibility_new</v-icon>
							</v-btn>
							<v-btn dark block>
								Reset
								<v-icon right dark>undo</v-icon>
							</v-btn>
							<v-btn dark block>
								Upload Skin
								<v-icon right dark>cloud_upload</v-icon>
							</v-btn>
						</v-flex>
					</v-flex>
				</v-layout>
			</v-flex>
			<v-flex>
				<v-layout align-start column>
					<v-flex>
						<v-chip label dark outline color="primary">
							Username:
						</v-chip>
						<span class="white--text text-lg-right">
							{{username}}
						</span>
					</v-flex>
					<v-flex>
						<v-chip label dark outline color="primary">
							AccessToken:
						</v-chip>
						<span class="white--text text-lg-right">
							{{accessToken}}
						</span>
					</v-flex>
					<v-flex>
						<v-chip label dark outline color="primary">
							Authorize Service:
						</v-chip>
						<span class="white--text text-lg-right">
							{{authMode}}
						</span>
					</v-flex>
					<v-flex>
						<v-chip label dark outline color="primary">
							Profile Service:
						</v-chip>
						<span class="white--text text-lg-right">
							{{profileMode}}
						</span>
					</v-flex>

					<v-flex offset-sm3>
						<v-btn block color="primary">Switch Account</v-btn>
					</v-flex>
					<v-flex>
						<v-btn block dark color="red">Logout</v-btn>
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
