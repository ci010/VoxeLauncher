<template>
  <v-layout fill-height>
    <v-btn
      style="position: absolute; left: 10px; top: 10px; "
      flat
      icon
      @click="goBack"
    >
      <v-icon dark>arrow_back</v-icon>
    </v-btn>

    <v-btn
      style="position: absolute; right: 10px; top: 10px; "
      flat
      icon
      @click="goSetting"
    >
      <v-icon dark>settings</v-icon>
    </v-btn>

    <v-btn
      color="suc"
      style="position: absolute; right: 10px; bottom: 10px; "
      dark
      large
      @click="launch"
    >Launch</v-btn>
  </v-layout>
</template>

<script>
export default {
  data: () => ({
  }),
  mounted() {
  },
  watch: {
  },
  methods: {
    launch() { },
    goSetting() {
      this.$router.push('setting')
    },
    goBack() {
      this.$router.push('profiles')
    },
  },
}
</script>

<style>
.moveable {
  -webkit-app-region: drag;
  user-select: none;
}

.non-moveable {
  -webkit-app-region: no-drag;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.01s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
