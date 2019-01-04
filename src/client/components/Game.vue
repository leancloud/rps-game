<template>
  <div>
    <div v-if="opponent">
      对手<Player :player="opponent" :result="state.result"></Player>
    </div>
    你<Player :player="localPlayer" :result="state.result"></Player>
    <div v-if="state.result && state.result.draw">平局</div>
    <div v-if="!state.started">正在等待其他玩家</div>
    <div v-else>
      <div v-show="!state.result && localPlayer.choice === null">
        请选择：
        <button v-on:click="choose(i)" v-for="(option, i) in options" v-bind:key="i">{{option}}</button>
      </div>
      <div v-show="state.result"><button v-on:click="leave()">离开房间</button></div>
    </div>
    <hr>
    <div>当前状态：{{state}}</div>
    <hr>
    <details open>
      <summary>日志</summary>
      <div v-for="log in logs" v-bind:key="log">{{log}}</div>
    </details>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import {
  play,
  Event as PlayEvent,
  ReceiverGroup,
  CustomEventData
} from "@leancloud/play";
import { createReduxGame, Event as ClientEvent } from "@leancloud/stateful-game/client";
import Player from './Player.vue';
import { Event, events, reducer, ValidChoice, RPSGameState } from "../../rps-game-rules";
import { jsonfyPlayers } from "../utils";

@Component({
  components: {
    Player,
  }
})
export default class Game extends Vue {
  private game = createReduxGame({
    client: play,
    events,
    reducer,
  });

  logs: string[] = [];
  options = ["✊", "✌️", "✋"];
  state = this.game.state;
  players = jsonfyPlayers(this.game.players);

  get opponent() {
    const player = this.players.find(player => !player.isLocal && !player.isMaster);
    if (!player) return;
    return {
      choice: this.state.choices[player.userId],
      userId: player.userId,
    };
  }

  get localPlayer() {
    const player = this.players.find(player => player.isLocal);
    if (!player) return;
    return {
      choice: this.state.choices[player.userId],
      userId: player.userId,
    };
  }

  created() {
    play.on(PlayEvent.PLAYER_ROOM_JOINED, ({ newPlayer }) => {
      this.players = jsonfyPlayers(this.game.players);
      this.log(`${newPlayer.userId} 加入了房间`, "Play");
    });
    play.on(PlayEvent.PLAYER_ROOM_LEFT, ({ leftPlayer }) => {
      this.log(`${leftPlayer.userId} 离开了房间`, "Play");
    });
    this.game.on(ClientEvent.STATE_UPDATE, (state) => {
      this.state = state;
      this.log(`状态变更为: ${JSON.stringify(state)}`, "Game");
    });
  }

  private choose(index: ValidChoice) {
    this.game.emitEvent(Event.PLAY, {index});
  }

  private leave() {
    play.leaveRoom();
  }

  private log(log: string, scope = "Game") {
    const now = new Date();
    this.logs.push(`[${scope}] [${now.toLocaleTimeString()} ${now.getMilliseconds()}] ${log}`);
  }
}
</script>

<style>
details,
details input {
  font-size: 60%;
}
</style>
