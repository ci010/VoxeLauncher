<template>
  <v-dialog v-model="value" persistent hide-overlay width="500" style="max-height: 100%">
    <v-toolbar dark tabs color="grey darken-3">
      <v-toolbar-title>{{ $t('task.manager') }}</v-toolbar-title>
      <v-spacer />
      <v-btn icon @click="$emit('close')">
        <v-icon>arrow_drop_down</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card flat style="min-height: 300px; max-height: 400px; max-width: 100%; overflow: auto;" dark color="grey darken-4">
      <v-card-text>
        {{ all.length === 0 ? $t('task.empty') : '' }}
        <v-treeview v-model="tree" hoverable transition :open="opened" :items="all" activatable
                    item-key="_internalId" open-on-click item-children="tasks" item-text="localText">
          <template v-slot:append="{ item, open }">
            <task-node-status :status="item.status" :total="item.total" :progress="item.progress" :hovered="hovered[item._internalId]" />
          </template>

          <template v-slot:label="{ item, open }">
            <div style="padding: 5px 0px;" @click="onTaskClick($event, item)" @contextmenu="showTaskContext($event, item)" @mouseenter="hovered[item._internalId] = true" @mouseleave="hovered[item._internalId] = false">
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
