<template>
	<v-container>
		<v-layout row wrap>
			<v-flex tag="h1" style="margin-bottom: 10px;" class="white--text" xs12>
				<span class="headline">{{$t('profile.modpackSetting')}}</span>
			</v-flex>
			<v-flex d-flex xs6>
				<v-text-field outline dark v-model="author" :label="$t('author')" :placeholder="$repo.state.user.name"
				  required></v-text-field>
			</v-flex>
			<v-flex d-flex xs6>
				<v-text-field outline dark v-model="url" :label="$t('url')" :placeholder="$repo.state.user.name"
				  required></v-text-field>
			</v-flex>
			<v-flex d-flex xs12>
				<v-text-field outline dark v-model="description" :label="$t('description')">
				</v-text-field>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
export default {
  data() {
    return {
      author: '',
      description: '',
      url: '',
    };
  },
  methods: {
    save() {
      this.$repo.dispatch('editProfile', {
        author: this.author,
        description: this.description,
        url: this.url,
      });
    },
    load() {
      const profile = this.$repo.getters['selectedProfile'];
      this.url = profile.url;
      this.author = profile.author;
      this.description = profile.description;
    },
  },
}
</script>

<style scoped=true>
.flex {
  padding: 6px 8px !important;
}
</style>
