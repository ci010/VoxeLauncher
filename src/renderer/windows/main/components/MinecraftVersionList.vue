<template>
  <v-list dark style="overflow-y: scroll; scrollbar-width: 0;" @mousewheel="onMouseWheel">
    <template v-for="(item, index) in versions">
      <v-list-tile :key="index" ripple style="margin: 0px 0;" @click="selectVersion(item)">
        <v-list-tile-avatar>
          <v-icon v-if="statuses[item.id] !== 'loading'">
            {{ statuses[item.id] === 'remote' ? 'cloud' : 'folder' }}
          </v-icon>
          <v-progress-circular v-else :width="2" :size="24" indeterminate />
        </v-list-tile-avatar>

        <v-list-tile-title>
          {{ item.id }}
        </v-list-tile-title>
        <v-list-tile-sub-title v-if="showTime">
          {{ item.releaseTime }}
        </v-list-tile-sub-title>

        <v-list-tile-action style="justify-content: flex-end;">
          <v-chip :color="item.type === 'release' ? 'primary' : '' " label dark>
            {{ item.type }}
          </v-chip>
        </v-list-tile-action>
      </v-list-tile>
    </template>
  </v-list>
</template>

<script>
export default {
  props: {
    filter: {
      type: Function,
      default: () => true,
    },
    showTime: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    statuses() {
      return this.$repo.getters.minecraftStatuses;
    },
    versions() {
      return this.$repo.state.version.minecraft.versions.filter(this.filter);
    },
  },
  methods: {
    onMouseWheel(e) {
      e.stopPropagation();
      return true;
    },
    selectVersion(v) {
      this.$emit('value', v);
    },
  },
};
</script>

<style>
</style>
