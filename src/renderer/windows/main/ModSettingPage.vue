<template>
  <v-container grid-list-xs fill-height style="overflow: auto;">
    <v-layout row wrap fill-height>
      <v-flex tag="h1" style="margin-bottom: 10px; padding: 6px; 8px;" class="white--text" xs7>
        <span class="headline">{{ $tc('mod.name', 2) }}</span>
      </v-flex>
      <v-flex xs5>
        <v-text-field v-model="filterSelected" color="primary" class="focus-solo" append-icon="filter_list"
                      :label="$t('filter')" dark hide-details />
      </v-flex>
      <v-flex d-flex xs6 style="padding-right: 5px;">
        <v-card dark class="card-list" @drop="onDropLeft" @dragover="onDragOver" @mousewheel="onMouseWheel">
          <v-card-title>
            <span class="text-sm-center" style="width: 100%; font-size: 16px;"> {{ $t('mod.unselected') }} </span> 
          </v-card-title>
          <p v-if="mods[1].length === 0" class="text-xs-center headline"
             style="position: absolute; top: 120px; right: 0px; user-select: none;">
            <v-icon style="font-size: 50px; display: block;">
              save_alt
            </v-icon>
            {{ $t('mod.hint') }}
          </p>
          <div class="list">
            <mod-card v-for="(mod, index) in mods[1].filter(m => filterMod(filterUnselected, m))" :key="mod.hash" :data="mod.metadata[0]"
                      :is-selected="false" :index="index" :hash="mod.hash" />
          </div>
        </v-card>
      </v-flex>
      <v-flex d-flex xs6 style="padding-left: 5px;">
        <v-card dark class="card-list right" @drop="onDropRight" @dragover="onDragOver" @mousewheel="onMouseWheel">
          <v-card-title>
            <span class="text-sm-center" style="width: 100%; font-size: 16px;"> {{ $t('mod.selected') }} </span> 
          </v-card-title>
          <p v-if="mods[0].length === 0" class="text-xs-center headline"
             style="position: absolute; top: 120px; right: 0px; user-select: none;">
            <v-icon style="font-size: 50px; display: block;">
              save_alt
            </v-icon>
            {{ $t('mod.hint') }}
          </p>
          <div class="list">
            <mod-card v-for="(mod, index) in mods[0].filter(m => filterMod(filterSelected, m))" :key="mod.hash" :data="mod.metadata[0]"
                      :is-selected="true" :index="index" :hash="mod.hash" />
          </div>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import Vue from 'vue';
import unknownPack from 'static/unknown_pack.png';
import SelectionList from './mixin/SelectionList';

export default {
  mixins: [SelectionList],
  data() {
    return {
      filterInCompatible: true,
      refreshing: false,
      filterUnselected: '',
      filterSelected: '',
    };
  },
  computed: {
    profile() { return this.$repo.getters.selectedProfile; },
    forge() { return this.profile.forge; },
    mods() {
      const mods = this.$repo.getters.mods;
      const selectedModsIds = this.forge.mods || [];
      const selected = {};
      for (const id of selectedModsIds) {
        selected[id] = true;
      }
      const unselectedMods = [];
      const idToMod = {};
      for (const mod of mods) {
        const modMeta = mod.metadata[0];
        idToMod[`${modMeta.modid}:${modMeta.version}`] = mod;
        if (!selected[`${modMeta.modid}:${modMeta.version}`]) unselectedMods.push(mod);
      }
      const selectedMods = selectedModsIds.map(id => idToMod[id] || { id, missing: true, metadata: [{ name: 'missing' }] });
      return [selectedMods, unselectedMods];
    },
  },
  mounted() {
  },
  methods: {
    insert(index, toIndex) {
      if (index === toIndex) return;
      const mods = [...this.forge.mods || []];
      const deleted = mods.splice(index, 1);
      mods.splice(toIndex, 0, ...deleted);
      this.$repo.dispatch('editProfile', { forge: { mods } });
    },
    select(index) {
      const [selected, unselected] = this.mods;
      const newJoin = unselected[index];
      const mods = [...this.forge.mods || []];
      mods.unshift(`${newJoin.metadata[0].modid}:${newJoin.metadata[0].version}`);
      this.$repo.dispatch('editProfile', { forge: { mods } });
    },
    unselect(index) {
      const mods = [...this.forge.mods || []];
      Vue.delete(mods, index);
      this.$repo.dispatch('editProfile', { forge: { mods } });
    },
    dropFile(path) {
      this.$repo.dispatch('importResource', path).catch((e) => { console.error(e); });
    },
    filterMod(text, mod) {
      if (!text) return true;
      return mod.name.toLowerCase().indexOf(text.toLowerCase()) !== -1;
    },
  },
};
</script>
<style scoped=true>
</style>
