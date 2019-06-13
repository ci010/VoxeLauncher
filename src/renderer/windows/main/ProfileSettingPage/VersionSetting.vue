<template>
	<v-container>
		<v-layout row wrap>
			<v-flex tag="h1" style="margin-bottom: 10px;" class="white--text" xs12>
				<span class="headline">{{$t('profile.versionSetting')}}</span>
			</v-flex>
			<v-flex xs12>
				<v-toolbar dark tabs color="transparent" flat>
					<v-tabs v-model="active" color="transparent" dark slider-color="primary">
						<v-tab>
							Minecraft Versions
						</v-tab>
						<v-tab>
							Forge Versions
						</v-tab>
						<v-tab>
							Liteloader Versions
						</v-tab>
					</v-tabs>
					<template v-slot:extension>
						<v-text-field append-icon="filter" flat label="Search" solo-inverted></v-text-field>
					</template>
				</v-toolbar>
				<v-tabs-items v-model="active" color="transparent" dark slider-color="primary" style="max-height: 50vh; overflow-y: auto"
				  @mousewheel="onMouseWheel">
					<v-tab-item @mousewheel="onMouseWheel">
						<minecraft-version-list></minecraft-version-list>
					</v-tab-item>
					<v-tab-item @mousewheel="onMouseWheel">
						<forge-version-list></forge-version-list>
					</v-tab-item>
					<v-tab-item>
					</v-tab-item>
				</v-tabs-items>
			</v-flex>

		</v-layout>
	</v-container>
</template>

<script>
export default {
  data() {
    return {
      active: 0,
    };
  },
  methods: {
    save() {
      // this.$repo.dispatch('editProfile', {
      //   author: this.author,
      //   description: this.description,
      //   url: this.url,
      // });
    },
    load() {
      // const profile = this.$repo.getters['selectedProfile'];
      // this.url = profile.url;
      // this.author = profile.author;
      // this.description = profile.description;
    },
    onMouseWheel(e) {
      e.stopPropagation();
      return true;
    }
  },
}
</script>

<style scoped=true>
.flex {
  padding: 6px 8px !important;
}
</style>
