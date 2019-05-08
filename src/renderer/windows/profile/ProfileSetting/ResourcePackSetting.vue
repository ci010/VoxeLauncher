<template>
	<v-container grid-list-xs fill-height style="overflow: auto;">
		<v-layout row wrap>
			<v-flex tag="h1" style="margin-bottom: 10px; padding: 6px; 8px;" class="white--text" xs12>
				<span class="headline">{{$tc('resourcepack.name', 2)}}</span>
			</v-flex>
			<v-flex d-flex xs6>
				<v-card dark class="pack-list" @drop="onDropLeft" @dragover="onDragOver">
					<p class="text-xs-center headline" style="position: absolute; top: 120px; right: 0px; user-select: none;"
					  v-if="resourcePacks[1].length === 0">
						<v-icon style="font-size: 50px; display: block;">save_alt</v-icon>
						{{$t('resourcepack.hint')}}
					</p>
					<resource-pack-card v-for="(pack, index) in resourcePacks[1]" :key="pack.hash" :data="pack.metadata"
					  :isSelected="false" :index="index">
					</resource-pack-card>
				</v-card>
			</v-flex>
			<v-flex d-flex xs6>
				<v-card dark class="pack-list" @drop="onDropRight" @dragover="onDragOver">
					<p class="text-xs-center headline" style="position: absolute; top: 120px; right: 0px; user-select: none;"
					  v-if="resourcePacks[0].length === 0">
						<v-icon style="font-size: 50px; display: block;">save_alt</v-icon>
						{{$t('resourcepack.hint')}}
					</p>
					<resource-pack-card v-for="(pack, index) in resourcePacks[0]" :key="pack.hash" :data="pack.metadata"
					  :isSelected="true" :index="index">
					</resource-pack-card>
				</v-card>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
import Vue from 'vue';
import ResourcePackCard from './ResourcePackCard';
import unknownPack from 'static/unknown_pack.png'

export default {
  computed: {
    resourcePacks() {
      const packs = this.$repo.getters['resource/resourcepacks'];
      const packnames = this.$repo.getters['profile/current'].settings.resourcePacks || [];

      const selectedNames = {};
      for (const name of packnames) {
        selectedNames[name] = true;
      }

      const unselectedPacks = [];

      const nameToPack = {};
      for (const pack of packs) {
        nameToPack[pack.name + pack.ext] = pack;
        if (!selectedNames[pack.name + pack.ext])
          unselectedPacks.push(pack);
      }
      const selectedPacks = packnames
        .map(name => nameToPack[name] || { name, missing: true, metadata: { packName: name, description: 'Cannot find this pack', icon: unknownPack, format: -1 } });

      return [selectedPacks, unselectedPacks];
    },
  },
  methods: {
    changePosition(index, toIndex) {
      if (index === toIndex) return;
      const packs = [...this.$repo.getters['profile/current'].settings.resourcePacks || []];

      const deleted = packs.splice(index, 1);
      packs.splice(toIndex, 0, ...deleted);

      this.$repo.commit('profile/gamesettings', {
        resourcePacks: packs,
      });
    },
    select(index) {
      const [selectedPacks, unselectedPacks] = this.resourcePacks;

      const newJoin = unselectedPacks[index];
      const packs = [...this.$repo.getters['profile/current'].settings.resourcePacks || []];
      packs.unshift(newJoin.name + newJoin.ext);
      this.$repo.commit('profile/gamesettings', {
        resourcePacks: packs,
      });
    },
    unselect(index) {
      const packs = [...this.$repo.getters['profile/current'].settings.resourcePacks || []];
      Vue.delete(packs, index);
      this.$repo.commit('profile/gamesettings', {
        resourcePacks: packs,
      });
    },

    onDragOver(event) {
      event.preventDefault();
      return false;
    },
    onDropLeft(event) {
      return this.handleDrop(event, true);
    },
    onDropRight(event) {
      return this.handleDrop(event, false);
    },
    handleDrop(event, left) {
      event.preventDefault();
      const length = event.dataTransfer.files.length;
      if (length > 0) {
        console.log(`Detect drop import ${length} file(s).`);
        for (let i = 0; i < length; ++i) {
          this.$repo.dispatch('resource/import', event.dataTransfer.files[i])
            .catch((e) => {
              console.error(e);
            });
        }
      }
      const indexText = event.dataTransfer.getData('Index');
      if (indexText) {
        const index = Number.parseInt(indexText.substring(1), 10);
        const y = event.clientY;
        if (indexText[0] === 'L') {
          if (left) {
            // do nothing now...
          } else {
            this.select(index);
          }
        } else {
          if (left) {
            this.unselect(index);
          } else {
            const all = document.getElementsByClassName('resource-pack-card');
            for (let i = 0; i < all.length; ++i) {
              const rect = all.item(i).getBoundingClientRect();
              if (y < rect.y + rect.height) {
                this.changePosition(index, i);
                break;
              }
              if (i === all.length - 1) {
                this.changePosition(index, all.length);
              }
            }
          }
        }
      }
    },
  },
  components: { ResourcePackCard }
}
</script>
<style scoped=true>
.pack-list {
  padding: 10px;
  margin: 6px 8px;
  min-height: 450px;
  max-height: 450px;

  max-width: 95%;
  min-width: 95%;
  overflow: auto;
}
</style>
