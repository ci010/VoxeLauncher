<template>
  <v-dialog v-model="value" persistent hide-overlay width="500" style="max-height: 100%">
    <v-toolbar dark tabs color="grey darken-3">
      <v-toolbar-title>{{ $t('task.manager') }}</v-toolbar-title>
      <v-spacer />
      <v-btn icon @click="$emit('close')">
        <v-icon>arrow_drop_down</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card flat style="min-height: 300px; max-width: 100%;" dark color="grey darken-4">
      <v-card-text>
        {{ all.length === 0 ? $t('task.empty') : '' }}
        <v-treeview v-model="tree" hoverable transition :open="opened" :items="all" activatable
                    item-key="_internalId" open-on-click item-children="tasks" item-text="localText">
          <template v-slot:append="{ item, open }">
            <v-icon v-if="item.status !== 'running'" style="margin-right: 5px" :color="item.status === 'successed'?'green':item.status === 'cancelled'?'white':'red'">
              {{ item.status === 'successed' ? 'check' : item.status === 'cancelled' ? 'stop' :
                'error_outline' }}
            </v-icon>
            <v-progress-circular v-else-if="!hovered[item._internalId]" style="margin-right: 7px" small :size="20" :value="item.progress / item.total * 100"
                                 :width="3" :indeterminate="item.total === -1" color="white" class="mb-0" @mouseenter="setHoverState(item._internalId, true)" />
            <v-icon v-else v-ripple color="red" style="cursor: pointer; border-radius: 25px; margin-right: 5px; padding: 1px;" @click="cancelTask" @mouseleave="setHoverState(item._internalId, false)">
              close 
            </v-icon>
          </template>

          <template v-slot:label="{ item, open }">
            <div style="padding: 5px 0px;" @click="onTaskClick($event, item)" @contextmenu="showTaskContext($event, item)">
              <span style="white-space: nowrap; overflow: hidden;  text-overflow: ellipsis; max-width: 250px;">{{ $t(item.path, item.arguments || {}) }}</span>
              <span style="color: grey; font-size: 12px; font-style: italic; ">{{ item.time }}</span>
              <div style="color: grey; font-size: 12px; font-style: italic; max-width: 300px;">
                {{ item.message }}
              </div>
            </div>
          </template>
        </v-treeview>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import Vue from 'vue';

export default {
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    tree: [],
    opened: [],
    active: 0,
    hovered: {},
  }),
  computed: {
    all() { return this.$repo.state.task.tasks; },
  },
  methods: {
    showTaskContext(event, item) {
      this.$menu([{ title: 'hello', onClick() { } }], event.clientX, event.clientY);
    },
    onTaskClick(event, item) {
      this.$electron.clipboard.writeText(item.message);
    },
    setHoverState(id, state) {
      Vue.set(this.hovered, id, state);
    },
    cancelTask(event, id) {
      event.stopPropagation();
      this.$repo.dispatch('cancelTask', id);
    },
  },

};
</script>

<style scoped=true>
.v-progress-linear {
  margin-left: 10px;
}
</style>
<style>
.v-treeview-node__label {
  white-space: normal;
  line-break: normal;
  word-break: break-all;
}
</style>
