<template>
  <div>
    <div class="field mode-select">
      <label for="mode" class="label">Mode</label>
      <div class="select is-multiple">
        <select name="mode" v-bind:mode="mode" v-on:change="$emit('update:mode', $event.target.value)" size="3">
          <option v-for="m in modes" v-bind:key="m" v-bind:selected="m === mode">{{m}}</option>
        </select>
      </div>
    </div>

    <hr/>

    <div class="field is-grouped is-grouped-centered">
      <div class="control">
        <button class="button is-info" v-on:click="match">快速开始</button>
      </div>
      <div class="control">
        <button class="button" v-on:click="create">创建新游戏</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { configs } from "../configs";
import { GameMode } from "../../games/types";

@Component
export default class Lobby extends Vue {
  @Prop() userId!: string;
  @Prop() onJoinRoom!: (roomName: string) => void;

  @Prop() private mode!: GameMode;

  id = Date.now().toString();
  modes = GameMode;

  match() {
    return fetch(`${configs.clientEngineServer}/api/reservation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mode: this.mode,
        playerId: this.userId,
      })
    })
      .then(data => data.json())
      .then(({ roomName }) => this.onJoinRoom(roomName))
  }

  create() {
    return fetch(`${configs.clientEngineServer}/api/game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mode: this.mode,
        playerId: this.userId,
      })
    })
      .then(data => data.json())
      .then(({ roomName }) => this.onJoinRoom(roomName));
  }
}
</script>

<style>
.mode-select {
  text-align: center;
}

.select.is-multiple select {
  height: auto;
  padding: 0;
}

.select.is-multiple select option {
  padding: .5em 1em;
}
</style>
