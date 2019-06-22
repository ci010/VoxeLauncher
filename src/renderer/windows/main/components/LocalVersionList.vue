<template>
	<v-list v-if="versions.length !== 0" dark style="overflow-y: scroll; scrollbar-width: 0; background-color: transparent;">
		<template v-for="(item, index) in versions">
			<v-list-tile ripple :key="index" @click="selectVersion(item)" style="margin: 0px 0;">
				<v-list-tile-avatar>
					<v-btn @click="openVersionDir($event, item)" icon style="cursor: pointer">
						<v-icon> folder </v-icon>
					</v-btn>
				</v-list-tile-avatar>
				<v-list-tile-title>
					{{ item.id }}
				</v-list-tile-title>
				<v-list-tile-sub-title v-html="item.minecraft"></v-list-tile-sub-title>
				<v-list-tile-action style="justify-content: flex-end;">
					<v-btn @mousedown="$event.stopPropagation()" style="cursor: pointer" @click="deleteVersion($event, item)"
					  icon color="red" flat>
						<v-icon>delete</v-icon>
					</v-btn>
					<!-- <v-chip label dark v-if="item.forge">
						Forge
					</v-chip> -->
				</v-list-tile-action>
			</v-list-tile>
		</template>
		<v-dialog v-model="deletingVersion" max-width="290">
			<v-card dark>
				<v-card-title class="headline">{{$t('version.deleteTitle')}}</v-card-title>
				<v-card-text>
					{{$t('version.deleteDescription')}}
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn flat @click="cancelDeleting()">{{$t('no')}}</v-btn>
					<v-btn color="red darken-1" flat @click="comfireDeleting()">{{$t('yes')}}</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
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
  data() {
    return {
      deletingVersion: false,
      deletingVersionId: '',
    }
  },
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
      this.$repo.dispatch('showVersionsDirectory');
    },
    openVersionDir(event, v) {
      event.stopPropagation();
      this.$repo.dispatch('showVersionDirectory', v.folder);
      return false;
    },
    deleteVersion(event, v) {
      event.stopPropagation();
      this.deletingVersion = true;
      this.deletingVersionId = v.folder;
      return false;
    },
    comfireDeleting() {
      this.$repo.dispatch('deleteVersion', this.deletingVersionId);
      this.deletingVersion = false;
      this.deletingVersionId = '';
    },
    cancelDeleting() {
      this.deletingVersion = false;
      this.deletingVersionId = '';
    }
  }
}
</script>

<style>
</style>
