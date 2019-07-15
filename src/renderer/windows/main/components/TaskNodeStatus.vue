<template>
  <div @mouseenter="enter" @mouseleave="leave">
    <v-icon v-if="status !== 'running'" style="margin-right: 5px" :color="status === 'successed'?'green':status === 'cancelled'?'white':'red'">
      {{ status === 'successed' ? 'check' : status === 'cancelled' ? 'stop' :
        'error_outline' }}
    </v-icon>
    <v-progress-circular v-else-if="total === -1 || !hovered" style="margin-right: 7px" small :size="20" :value="percentage"
                         :width="3" :indeterminate="total === -1" color="white" class="mb-0" />
    <span v-else style="margin-right: 7px">
      {{ percentage.toFixed(2) }} %
    </span>
  </div>
</template>

<script>
export default {
  props: {
    status: {
      type: String,
      default: '',
    },
    progress: {
      type: Number,
      default: -1,
    },
    total: {
      type: Number,
      default: -1,
    },
    hovered: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // hovered: false
    };
  },
  computed: {
    percentage() {
      return this.progress / this.total;
    },
  },
  methods: {
    enter() {
      // this.hovered = true;
    },
    leave() {
      // this.hovered = false;
    },
  },
};
</script>

<style>
</style>
