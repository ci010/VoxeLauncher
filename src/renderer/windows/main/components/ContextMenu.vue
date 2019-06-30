<template>
    <v-menu
      v-model="showMenu"
      :position-x="x"
      :position-y="y"
      absolute
      offset-y
      z-index="205"
    >
      <v-list id="cm">
        <v-list-tile
          v-for="(item, index) in items"
          :key="index"
          @click="item.onClick"
        >
          <v-list-tile-title>{{ item.title }}</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>
</template>

<script>
import Vue from 'vue';

export default {
  data() {
    return {
      showMenu: true,
      x: 10,
      y: 10,
      items: [],
    }
  },
  created() {
    Vue.prototype.$menu = this.show;
  },
  methods: {
    show(items, x, y) {
      console.log('show');
      this.x = x;
      this.y = y;
      this.items = items;
      this.showMenu = true;
    },
    hide() {
      this.showMenu = false;
    },
  },
}
</script>

<style>
</style>
