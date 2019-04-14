<template>
	<v-container grid-list-xs fill-height style="overflow: auto;">
		<v-layout row wrap>
			<v-flex tag="h1" style="margin-bottom: 10px; padding: 6px; 8px;" class="white--text" xs12>
				<span class="headline">{{$tc('resourcepack.name', 2)}}</span>
			</v-flex>
			<v-flex d-flex sm6>
				<v-card dark class="pack-list" flat @drop="onDrop" @dragover="onDragOver">
					<v-card-text>
						<p class="text-xs-center headline" style="position: absolute; top: 60px; right: 0px; user-select: none;"
						  v-if="resourcePacks[1].length === 0">
							<v-icon style="font-size: 50px; display: block;">save_alt</v-icon>
							{{$t('resourcepack.hint')}}
						</p>
					</v-card-text>
					<resource-pack-card v-for="(pack, index) in resourcePacks[1]" :key="pack.hash" :data="pack.metadata"
					  :isSelected="false" @trigger="select(index)">
					</resource-pack-card>
				</v-card>
			</v-flex>
			<v-flex d-flex sm6>
				<v-card dark class="pack-list" @drop="onDrop" @dragover="onDragOver">
					<p class="text-xs-center headline" style="position: absolute; top: 60px; right: 0px; user-select: none;"
					  v-if="resourcePacks[0].length === 0">
						<v-icon style="font-size: 50px; display: block;">save_alt</v-icon>
						{{$t('resourcepack.hint')}}
					</p>
					<resource-pack-card v-for="(pack, index) in resourcePacks[0]" :key="pack.hash" :data="pack.metadata"
					  :isSelected="true" @trigger="unselect(index)" @moveup="moveup(index)" @movedown="movedown(index)">
					</resource-pack-card>
				</v-card>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
import Vue from 'vue';
import ResourcePackCard from './ResourcePackCard';

export default {
  computed: {
    resourcePacks() {
      const packs = this.$repo.getters['resource/resourcepacks'];
      const packnames = this.$repo.getters['profile/current'].settings.resourcePacks || [];
      const selectedNames = {};
      for (const name of packnames) {
        selectedNames[name] = true;
      }
      const selectedPacks = [];
      const unselectedPacks = [];
      for (const pack of packs) {
        if (selectedNames[pack.name + pack.ext]) {
          selectedPacks.push(pack);
          selectedNames[pack.name + pack.ext];
        } else {
          unselectedPacks.push(pack);
        }
      }
      for (const name of Object.keys(selectedNames)) {
        selectedPacks.push({ name, missing: true, metadata: { packName: name, description: 'Cannot find this pack', icon: '', format: -1 } });
      }
      return [selectedPacks, unselectedPacks];
    },
  },
  methods: {
    moveup(index) {
      const packs = [...this.$repo.getters['profile/current'].settings.resourcePacks || []];

      const last = packs[index - 1];
      packs[index - 1] = packs[index];
      packs[index] = last;
      this.$repo.commit('profile/editSettings', {
        resourcePacks: packs,
      });
    },
    movedown(index) {
      const packs = [...this.$repo.getters['profile/current'].settings.resourcePacks || []];

      const next = packs[index + 1];
      packs[index + 1] = packs[index];
      packs[index] = next;
      this.$repo.commit('profile/editSettings', {
        resourcePacks: packs,
      });
    },
    select(index) {
      const [selectedPacks, unselectedPacks] = this.resourcePacks;

      const newJoin = unselectedPacks[index];
      const packs = [...this.$repo.getters['profile/current'].settings.resourcePacks || []];
      packs.unshift(newJoin.name + newJoin.ext);
      this.$repo.commit('profile/editSettings', {
        resourcePacks: packs,
      });
    },
    unselect(index) {
      const packs = [...this.$repo.getters['profile/current'].settings.resourcePacks || []];
      Vue.delete(packs, index);
      this.$repo.commit('profile/editSettings', {
        resourcePacks: packs,
      });
    },
    onDragOver(event) {
      event.preventDefault();
      return false;
    },
    onDrop(event) {
      event.preventDefault();
      const length = event.dataTransfer.files.length;
      for (let i = 0; i < length; ++i) {
        this.$repo.dispatch('resource/import', event.dataTransfer.files[i])
          .catch((e) => {
            console.error(e);
          });
      }
    },
  },
  components: { ResourcePackCard }
}
</script>
<style scoped=true>
.pack-list {
  margin: 6px 8px;
  min-height: 450px;
}
</style>
