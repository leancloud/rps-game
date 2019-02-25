<template>
  <span>
    （{{player.userId}}）：
    <span v-if="player.choice === null">未出拳</span>
    <span v-else-if="player.choice === unknownChoice">❓</span>
    <span v-else>{{options[player.choice]}}</span>
    <span v-show="isWinner">🏆</span>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { UNKNOWN_CHOICE, Result } from "./models";

@Component
export default class Player extends Vue {
  
  @Prop()
  player?: {
    choice?: number | null,
    userId?: string
  };

  @Prop()
  result?: Result;

  unknownChoice = UNKNOWN_CHOICE;
  options = ["✊", "✌️", "✋"];

  get isWinner() {
    return this.result && this.player && this.result.winnerId === this.player.userId
  }
}
</script>
