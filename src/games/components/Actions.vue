<template>
  <div>
    <div v-if="result" class="has-text-centered">
      <p class="title">
        <span v-if="result.draw">平局</span>
        <span v-else-if="result.winnerId === player.userId">你赢了</span>
        <span v-else>你输了</span>
      </p>
      <button class="button is-info" v-on:click="leave()">回到大厅</button>
    </div>
    <div v-else-if="player.choice === null" class="field">
      <span class="label">请选择：</span>
      <div class="buttons are-large">
        <button class="button" v-on:click="choose(i)" v-for="(option, i) in options" v-bind:key="i">
          <span class="icon is-large">{{option}}</span>
        </button>
      </div>
    </div>
    <div v-else>
      等待对手选择
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Result, Choice, options } from "../models";

@Component
export default class Actions extends Vue {
  options = options;
  
  @Prop()
  result!: Result;
  
  @Prop()
  localPlayer!: {
    choice: Choice,
    userId: string,
  }

  get player() {
    return this.localPlayer || {};
  }

  @Prop()
  leave!: () => any;

  @Prop()
  choose!: (index: number) => any;

}
</script>
