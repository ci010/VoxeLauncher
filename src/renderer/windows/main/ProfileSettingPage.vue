<template>
  <v-layout align-center fill-height @mousewheel="onScroll">
    <v-item-group v-model="window" class="shrink" mandatory tag="v-flex">
      <v-item v-for="(p, i) in components" :key="i">
        <div slot-scope="{ active, toggle }">
          <v-btn small dark :input-value="active" icon @click="toggle">
            <v-icon small :color="active ? 'primary': ''">
              lens
            </v-icon>
          </v-btn>
        </div>
      </v-item>
    </v-item-group>

    <v-flex fill-height class="profile-setting-body">
      <v-window v-model="window" vertical style="height: 100%">
        <v-window-item v-for="(p, i) in components" :key="i" style="height: 100%">
          <sub-window v-model="subWindows[i]" :selected="i === window" :components="p" @scroll="onScroll"
                      @goto="goto" />
          <v-layout style="position: absolute; z-index: 2; bottom: 10px; width: 100%; padding-left: 4px; padding-right: 16px;"
                    align-center justify-center>
            <v-item-group v-model="subWindows[window]" class="shrink" mandatory tag="v-flex">
              <v-item v-for="(c, i) in components[window]" :key="i">
                <v-icon slot-scope="{ active, toggle }" dark :color="active ? 'primary': ''" @click="toggle">
                  minimize
                </v-icon>
              </v-item>
            </v-item-group>
          </v-layout>
        </v-window-item>
      </v-window>
    </v-flex>
  </v-layout>
</template>

<script>
import Vue from 'vue';

export default {
  data: () => ({
    components: [
      ['version-setting', 'base-setting', 'advanced-setting'],
      ['game-setting', 'resource-pack-setting'],
      ['mod-setting'],
    ],
    subWindows: [
      1, 0, 0,
    ],
    window: 0,
    cooldown: false,
    lastX: null,
    lastY: null,
  }),
  activated() {

  },
  deactivated() {
    this.window = 0;
    Vue.set(this.subWindows, 0, 1);
  },
  methods: {
    computeWinSwap(rawDelta, lastKey, lastValue, length) {
      const delta = Math.abs(rawDelta);
      const last = this[lastKey];
      this[lastKey] = delta;
      if (last > delta) return undefined;
      if (this.cooldown) return undefined;

      const sign = Math.sign(rawDelta);
      let result = lastValue;
      if (delta > 50) {
        result += 1 * sign;
        if (result >= length) {
          result = 0;
        } else if (result < 0) {
          result = length - 1;
        }
        this.cooldown = true;
        setTimeout(() => { this.cooldown = false; }, 800);
      }
      return result;
    },
    onScroll(e) {
      e.preventDefault();
      e.stopPropagation();
      let last = this.subWindows[this.window];
      let result = this.computeWinSwap(e.deltaX, 'lastX', last, this.components[this.window].length);
      if (typeof result === 'number') {
        Vue.set(this.subWindows, this.window, result);
      }
      if (last === result) {
        last = this.window;
        result = this.computeWinSwap(e.deltaY, 'lastY', last, this.components.length);
        if (typeof result === 'number') {
          this.window = result;
        }
      }
    },
    goto(e) {
      const [win, subwin] = e;
      this.window = win;
      Vue.set(this.subWindows, win, subwin);
    },
  },
};
</script>

<style>
.v-window__container {
  height: 100%;
}
.profile-setting-body .container {
  margin-left: 0px;
  padding-left: 4px;
}
</style>
