<template>
	<v-container grid-list-xs fill-height style="overflow: auto;">
		<v-layout row wrap>
			<v-flex tag="h1" style="margin-bottom: 10px; padding: 6px; 8px;" class="white--text" xs12>
				<span class="headline">{{$tc('mod.name', 2)}}</span>
			</v-flex>
			<v-flex d-flex xs6>
				<forge-version-menu @value="onSelectForge">
					<template v-slot="{ on }">
						<v-text-field hide-details :loading="refreshing" dark v-model="forgeVersion" placeholder="Disabled"
						  :label="$t('forge.version')" :readonly="true" v-on="on"></v-text-field>
					</template>
				</forge-version-menu>
			</v-flex>
			<v-flex d-flex xs6>
			</v-flex>
			<v-flex d-flex xs6>
				<v-card dark class="pack-list" @drop="onDropLeft" @dragover="onDragOver">
					<p class="text-xs-center headline" style="position: absolute; top: 120px; right: 0px; user-select: none;"
					  v-if="mods[1].length === 0">
						<v-icon style="font-size: 50px; display: block;">save_alt</v-icon>
						{{$t('mod.hint')}}
					</p>
					<mod-card v-for="(pack, index) in mods[1]" :key="pack.hash" :data="pack.metadata[0]"
					  :isSelected="false" :index="index" :hash="pack.hash" :compatible="compatibilities[pack.hash]">
					</mod-card>
				</v-card>
			</v-flex>
			<v-flex d-flex xs6>
				<v-card dark class="pack-list right" @drop="onDropRight" @dragover="onDragOver">
					<p class="text-xs-center headline" style="position: absolute; top: 120px; right: 0px; user-select: none;"
					  v-if="mods[0].length === 0">
						<v-icon style="font-size: 50px; display: block;">save_alt</v-icon>
						{{$t('mod.hint')}}
					</p>
					<mod-card v-for="(pack, index) in mods[0]" :key="pack.hash" :data="pack.metadata[0]"
					  :isSelected="true" :index="index" :hash="pack.hash" :compatible="compatibilities[pack.hash]">
					</mod-card>
				</v-card>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
import Vue from 'vue';
import SelectionList from '../SelectionList';
import ModCard from './ModCard';
import unknownPack from 'static/unknown_pack.png';
import ForgeVersionMenu from '../ForgeVersionMenu';
import { isCompatible } from 'universal/utils/versions';

export default {
  mixins: [SelectionList],
  data() {
    const forge = this.$repo.getters['profile/current'].forge;
    return {
      enabled: forge.enabled,
      forgeVersion: forge.version,
      filterInCompatible: true,
      refreshing: false,
    }
  },
  props: {
    selected: {
      type: Boolean,
    }
  },
  watch: {
    selected() {
      if (this.selected) {
        this.refreshing = true;
        this.$repo.dispatch('version/forge/refresh')
          .catch(e => {
            console.error(e);
          })
          .finally(() => {
            this.refreshing = false;
          });
      } else {
        this.$repo.commit('profile/forge', { enabled: this.enabled });
      }
    },
  },
  computed: {
    profile() { return this.$repo.getters['profile/current']; },
    forge() { return this.profile.forge; },
    compatibilities() {
      const mods = this.$repo.getters['resource/mods'];
      const map = {};
      for (const mod of mods) {
        const meta = mod.metadata[0];
        console.log(meta);
        const acceptVersion = meta.acceptMinecraftVersion ? meta.acceptMinecraftVersion : `[${meta.mcversion}]`;
        map[mod.hash] = isCompatible(acceptVersion, this.profile.mcversion);
      }
      return map;
    },
    mods() {

      const mods = this.$repo.getters['resource/mods'];
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
  methods: {
    onSelectForge(version) {
      if (version) {
        this.enabled = true;
        this.forgeVersion = version.version;
      } else {
        this.enabled = false;
        this.forgeVersion = '';
      }
    },
    insert(index, toIndex) {
      if (index === toIndex) return;
      const mods = [...this.forge.mods || []];
      const deleted = mods.splice(index, 1);
      mods.splice(toIndex, 0, ...deleted);
      this.$repo.commit('profile/forge', { mods });
    },
    select(index) {
      const [selected, unselected] = this.mods;
      const newJoin = unselected[index];
      const mods = [...this.forge.mods || []];
      mods.unshift(newJoin.metadata[0].modid + ':' + newJoin.metadata[0].version);
      this.$repo.commit('profile/forge', { mods });
    },
    unselect(index) {
      const mods = [...this.forge.mods || []];
      Vue.delete(mods, index);
      this.$repo.commit('profile/forge', { mods });
    },
    dropFile(path) {
      this.$repo.dispatch('resource/import', path).catch((e) => { console.error(e); });
    },
  },
  components: { ModCard, ForgeVersionMenu }
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