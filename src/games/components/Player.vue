<template>
  <span>
    <span v-show="isWinner" class="player-icon" title="winner">🏆</span>
    {{player.userId}}：
    <span v-if="player.choice === null" class="player-icon" title="Thinking">🤔</span>
    <span v-else-if="player.choice === unknownChoice" class="player-icon" title="settled">💡</span>
    <span v-else class="player-icon">{{options[player.choice]}}</span>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { UNKNOWN_CHOICE, Result, options } from "../models";

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
  options = options;

  get isWinner() {
    return this.result && this.player && this.result.winnerId === this.player.userId
  }
}
</script>

<style>
.player-icon {
  font-size: 2em;
  vertical-align: middle;
}
</style>
