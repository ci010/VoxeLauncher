<template>
	<v-list v-if="versions.length !== 0" dark style="overflow-y: scroll; scrollbar-width: 0; background-color: transparent;">
		<template v-for="(item, index) in versions">
			<v-list-tile ripple :key="index" @click="selectVersion(item)" style="margin: 0px 0;">
				<v-list-tile-title>
					{{ item.id }}
				</v-list-tile-title>
				<v-list-tile-sub-title v-html="item.minecraft"></v-list-tile-sub-title>
				<v-list-tile-action style="justify-content: flex-end;">
					<v-chip label dark v-if="item.forge">
						Forge
					</v-chip>
				</v-list-tile-action>
			</v-list-tile>
		</template>
	</v-list>
	<v-container v-else fill-height>
		<v-layout align-center justify-center row fill-height>
			<v-flex shrink tag="h1" class="white--text">
				<v-btn large>
					<v-icon left @click="browseVersoinsFolder"> folder </v-icon>
					{{$t('version.noLocalVersion')}}
				</v-btn>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
export default {
  props: {
    filterText: {
      type: String,
      default: '',
    },
  },
  computed: {
    versions() {
      return this.$repo.state.version.local
        .filter(version => version.id.indexOf(this.filterText) !== -1);
    },
  },
  methods: {
    selectVersion(v) {
      this.$emit('value', v);
    },
    browseVersoinsFolder() {
    },
  }
}
</script>

<style>
</style>
