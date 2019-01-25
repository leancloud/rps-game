<template>
  <div>
    <button v-on:click="match">快速开始</button>
    <button v-on:click="create">创建新游戏</button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { play, Event } from "@leancloud/play";
import { configs } from "../configs";
import { listen } from "../utils";

@Component
export default class Lobby extends Vue {
  @Prop() private onLogin!: () => any;

  id = Date.now().toString();

  match() {
    return fetch(`${configs.clientEngineServer}/api/reservation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        playerId: play.userId
      })
    })
      .then(data => data.json())
      .then(({ roomName }) => this.joinRoom(roomName));
  }

  create() {
    return fetch(`${configs.clientEngineServer}/api/game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        playerId: play.userId
      })
    })
      .then(data => data.json())
      .then(({ roomName }) => this.joinRoom(roomName));
  }

  joinRoom(roomName: string) {
    play.joinRoom(roomName);
    return listen(play, Event.ROOM_JOINED, Event.ROOM_JOIN_FAILED);
  }
}
</script>

<style>
</style>
