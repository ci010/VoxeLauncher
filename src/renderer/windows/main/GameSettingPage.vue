<template>
  <v-container grid-list-xs fill-height style="overflow: auto;">
    <v-layout row wrap justify-start align-content-start>
      <v-flex tag="h1" style="margin-bottom: 10px; padding: 6px; 8px;" class="white--text" xs12>
        <span class="headline">{{ $tc('gamesetting.name', 2) }}</span>
      </v-flex>
      <v-flex v-for="name in Object.keys(graphics)" :key="name" d-flex xs6
              @click="triggerGraphic(name)">
        <v-btn dark outline>
          {{ $t(`gamesetting.${name}.name`) + ' : ' +
            $t(`gamesetting.${name}.${graphics[name].value}`) }}
        </v-btn>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>

export default {
  data: () => ({
    graphics: {
      fancyGraphics: { options: [true, false], value: true },
      renderClouds: { options: [true, 'fast', false], value: true },
      ao: { options: [0, 1, 2], value: 2 },
      entityShadows: { options: [true, false], value: true },
      particles: { options: [0, 1, 2], value: 2 },
      mipmapLevels: { options: [0, 1, 2, 3, 4], value: 2 },
      useVbo: { options: [true, false], value: true },
      fboEnable: { options: [true, false], value: true },
      enableVsync: { options: [true, false], value: true },
      anaglyph3d: { options: [true, false], value: true },
    },
  }),
  mounted() { this.load(); },
  destroyed() { this.save(); },
  activated() { this.load(); },
  deactivated() { this.save(); },
  methods: {
    load() {
      const graphics = this.graphics;
      const settings = this.$repo.getters.selectedProfile.settings;
      for (const setting of Object.keys(graphics)) {
        graphics[setting].value = settings[setting] || graphics[setting].options[0];
      }
    },
    save() {
      const result = {};
      for (const setting of Object.keys(this.graphics)) {
        result[setting] = this.graphics[setting].value;
      }
      this.$repo.commit('gamesettings', result);
    },
    triggerGraphic(name) {
      const { value, options } = this.graphics[name];
      const index = options.indexOf(value);
      const nextIndex = (index + 1) % options.length;
      this.graphics[name].value = options[nextIndex];
    },
  },
};
</script>
