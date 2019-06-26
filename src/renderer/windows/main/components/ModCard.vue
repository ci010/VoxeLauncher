<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <v-card color="darken-1" flat hover :class="{ incompatible: !compatible }" class="draggable-card mod-card white--text" style="margin-top: 10px; padding: 0 10px;"
              draggable v-on="on" @dragstart="onDragStart" @dblclick="tryOpen">
        <v-layout justify-center align-center fill-height>
          <v-flex v-if="icon" xs4 style="padding: 0 10px 0 0;" fill-height>
            <v-img :src="icon" style="height: 100%" contain />
          </v-flex>
          <v-flex xs8 style="padding: 10px 0;">
            <h3>
              {{ data.name }}
              {{ data.version }}
            </h3>
            <span style="color: #bdbdbd">
              {{ data.description }}
            </span>
          </v-flex>
        </v-layout>
      </v-card>
    </template>
    {{ compatible ? $t('mod.compatible', { version: mcversion }) : $t('mod.incompatible', { accept: acceptedRange, actual:
      mcversion }) }}
    <v-divider />
  </v-tooltip>
</template>

<script>
import { isCompatible } from 'universal/utils/versions';
import unknownPack from 'static/unknown_pack.png';

export default {
  props: {
    data: {
      required: true,
      type: Object,
    },
    isSelected: {
      required: true,
      type: Boolean,
    },
    index: {
      required: true,
      type: Number,
    },
    hash: {
      required: true,
      type: String,
    },
  },
  data() {
    return {
      icon: unknownPack,
    };
  },
  computed: {
    mcversion() {
      return this.$repo.getters.selectedProfile.mcversion;
    },
    acceptedRange() {
      return this.data.acceptedMinecraftVersions ? this.data.acceptedMinecraftVersions : `[${this.data.mcversion}]`;
    },
    compatible() {
      return isCompatible(this.acceptedRange, this.mcversion);
    },
  },
  mounted() {
    this.$repo.dispatch('readForgeLogo', this.hash).then((icon) => {
      if (typeof icon === 'string' && icon !== '') {
        this.icon = `data:image/png;base64, ${icon}`;
      } else {
        this.icon = unknownPack;
      }
    });
  },
  methods: {
    onDragStart(e) {
      e.dataTransfer.setData('Index', `${this.isSelected ? 'R' : 'L'}${this.index}`);
    },
    tryOpen(e) {
      if (this.data.url) {
        this.$electron.shell.openExternal(this.data.url);
      }
    },
  },
};
</script>

<style scoped=true>
.incompatible.draggable-card:hover {
  background-color: #e65100;
}
.draggable-card:hover {
  background-color: #388E3C;
}

.title {
  max-width: 100%;
  white-space: nowrap;
}
</style>
