<template>
	<v-container grid-list-xs fill-height style="overflow: auto;">
		<v-layout row wrap>
			<v-flex tag="h1" style="margin-bottom: 10px; padding: 6px; 8px;" class="white--text" xs12>
				<span class="headline">{{$tc('mod.name', 2)}}</span>
			</v-flex>
			<v-flex d-flex xs6>
				<v-card dark class="pack-list" @drop="onDropLeft" @dragover="onDragOver" @mousewheel="onMouseWheel">
					<p class="text-xs-center headline" style="position: absolute; top: 120px; right: 0px; user-select: none;"
					  v-if="mods[1].length === 0">
						<v-icon style="font-size: 50px; display: block;">save_alt</v-icon>
						{{$t('mod.hint')}}
					</p>
					<mod-card v-for="(pack, index) in mods[1]" :key="pack.hash" :data="pack.metadata[0]"
					  :isSelected="false" :index="index" :hash="pack.hash">
					</mod-card>
				</v-card>
			</v-flex>
			<v-flex d-flex xs6>
				<v-card dark class="pack-list right" @drop="onDropRight" @dragover="onDragOver" @mousewheel="onMouseWheel">
					<p class="text-xs-center headline" style="position: absolute; top: 120px; right: 0px; user-select: none;"
					  v-if="mods[0].length === 0">
						<v-icon style="font-size: 50px; display: block;">save_alt</v-icon>
						{{$t('mod.hint')}}
					</p>
					<mod-card v-for="(pack, index) in mods[0]" :key="pack.hash" :data="pack.metadata[0]"
					  :isSelected="true" :index="index" :hash="pack.hash">
					</mod-card>
				</v-card>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
import Vue from 'vue';
import AbstractSetting from '../mixin/AbstractSetting';
import SelectionList from '../mixin/SelectionList';
import ModCard from './ModCard';
import unknownPack from 'static/unknown_pack.png';

export default {
  mixins: [SelectionList, AbstractSetting],
  data() {
    return {
      filterInCompatible: true,
      refreshing: false,
    }
  },
  computed: {
    profile() { return this.$repo.getters.selectedProfile; },
    forge() { return this.profile.forge; },
    mods() {
      const mods = this.$repo.getters['mods'];
      const selectedModsIds = this.forge.mods || [];
      const selected = {};
      for (const id of selectedModsIds) {
        selected[id] = true;
      }
      const unselectedMods = [];
      const idToMod = {};
      for (const mod of mods) {
        const modMeta = mod.metadata[0];
        idToMod[modMeta.modid + ':' + modMeta.version] = mod;
        if (!selected[modMeta.modid + ':' + modMeta.version])
          unselectedMods.push(mod);
      }
      const selectedMods = selectedModsIds.map(id => idToMod[id] || { id, missing: true, metadata: [{ name: 'missing' }] });
      return [selectedMods, unselectedMods];
    },
  },
  mounted() {
  },
  methods: {
    load() {
    },
    save() {
    },
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
      mods.unshift(newJoin.metadata[0].modid + ':' + newJoin.metadata[0].version);
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
  },
  components: { ModCard }
}
</script>
<style scoped=true>
.pack-list {
  padding: 10px;
  margin: 6px 0px;
  min-height: 400px;
  max-height: 400px;
  max-width: 95%;
  min-width: 95%;
  overflow: auto;
}
</style>