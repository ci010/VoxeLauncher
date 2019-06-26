<template>
  <v-container grid-list-xs fill-height style="overflow: auto;">
    <v-layout row wrap>
      <v-flex tag="h1" style="margin-bottom: 10px; padding: 6px; 8px;" class="white--text" xs12>
        <span class="headline">{{ $tc('resourcepack.name', 2) }}</span>
      </v-flex>
      <v-flex d-flex xs6>
        <v-card dark class="card-list" @drop="onDropLeft" @dragover="onDragOver" @mousewheel="onMouseWheel">
          <v-text-field v-model="filterUnselected" color="primary" class="focus-solo" append-icon="filter_list"
                        :label="$t('filter')" dark solo hide-details />
          <p v-if="resourcePacks[1].length === 0" class="text-xs-center headline"
             style="position: absolute; top: 120px; right: 0px; user-select: none;">
            <v-icon style="font-size: 50px; display: block;">
              save_alt
            </v-icon>
            {{ $t('resourcepack.hint') }}
          </p>
          <resource-pack-card v-for="(pack, index) in resourcePacks[1].filter(r => filterName(r,filterUnselected))"
                              :key="pack.hash" :data="pack.metadata" :is-selected="false" :index="index" />
        </v-card>
      </v-flex>
      <v-flex d-flex xs6>
        <v-card dark class="card-list right" @drop="onDropRight" @dragover="onDragOver" @mousewheel="onMouseWheel">
          <v-text-field v-model="filterSelected" color="primary" class="focus-solo" append-icon="filter_list"
                        :label="$t('filter')" dark solo hide-details />
          <p v-if="resourcePacks[0].length === 0" class="text-xs-center headline"
             style="position: absolute; top: 120px; right: 0px; user-select: none;">
            <v-icon style="font-size: 50px; display: block;">
              save_alt
            </v-icon>
            {{ $t('resourcepack.hint') }}
          </p>
          <resource-pack-card v-for="(pack, index) in resourcePacks[0].filter(r => filterName(r, filterSelected))"
                              :key="pack.hash" :data="pack.metadata" :is-selected="true" :index="index" />
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import Vue from 'vue';
import unknownPack from 'static/unknown_pack.png';
import SelectionList from '../mixin/SelectionList';
import ResourcePackCard from './ResourcePackCard';

export default {
  components: { ResourcePackCard },
  mixins: [SelectionList],
  data() {
    return {
      filterUnselected: '',
      filterSelected: '',
    };
  },
  computed: {
    resourcePacks() {
      const packs = this.$repo.getters.resourcepacks;
      const packnames = this.$repo.getters.selectedProfile.settings.resourcePacks || [];

      const selectedNames = {};
      for (const name of packnames) {
        selectedNames[name] = true;
      }

      const unselectedPacks = [];

      const nameToPack = {};
      for (const pack of packs) {
        nameToPack[pack.name + pack.ext] = pack;
        if (!selectedNames[pack.name + pack.ext]) unselectedPacks.push(pack);
      }
      const selectedPacks = packnames
        .map(name => nameToPack[name]
          || { name, missing: true, metadata: { packName: name, description: 'Cannot find this pack', icon: unknownPack, format: -1 } });

      return [selectedPacks, unselectedPacks];
    },
  },
  methods: {
    insert(index, toIndex) {
      if (index === toIndex) return;
      const packs = [...this.$repo.getters.selectedProfile.settings.resourcePacks || []];

      const deleted = packs.splice(index, 1);
      packs.splice(toIndex, 0, ...deleted);

      this.$repo.commit('gamesettings', {
        resourcePacks: packs,
      });
    },
    select(index) {
      const [selectedPacks, unselectedPacks] = this.resourcePacks;
      const newJoin = unselectedPacks[index];
      const packs = [...this.$repo.getters.selectedProfile.settings.resourcePacks || []];
      packs.unshift(newJoin.name + newJoin.ext);
      this.$repo.commit('gamesettings', {
        resourcePacks: packs,
      });
    },
    unselect(index) {
      const packs = [...this.$repo.getters.selectedProfile.settings.resourcePacks || []];
      Vue.delete(packs, index);
      this.$repo.commit('gamesettings', {
        resourcePacks: packs,
      });
    },
    dropFile(path) {
      this.$repo.dispatch('importResource', path).catch((e) => {
        console.error(e);
      });
    },
    filterName(r, str) {
      if (!str) return true;
      return r.name.toLowerCase().indexOf(str.toLowerCase()) !== -1;
    },
  },
};
</script>

<style>
.card-list {
  padding: 10px;
  margin: 0px 5px 20px 5px;
  min-height: 80vh;
  max-height: 80vh;

  overflow: auto;
}

.card-list .v-input__slot {
  box-shadow: none !important;
  transition: background 0.3s cubic-bezier(0.25, 0.8, 0.5, 1),
    box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.5, 1) !important;
  transition-property: background;
  transition-duration: 0.3s;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.5, 1);
  transition-delay: 0s;
}

.card-list .v-input__slot:hover {
  box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2),
    0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12) !important;
}

.card-list .v-input--is-focused .v-input__control .v-input__slot {
  box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2),
    0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12) !important;
}
</style>
