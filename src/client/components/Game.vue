<template>
  <div>
    <div ng-if="opponent.userId">
      对手<Player :player="opponent" :result="states.result"></Player>
    </div>
    你<Player :player="localPlayer" :result="states.result"></Player>
    <div v-if="states.result && states.result.draw">平局</div>
    <div v-if="!states.started">正在等待其他玩家</div>
    <div v-else>
      <div v-show="localPlayer.choice === null">
        请选择：
        <button v-on:click="choose(i)" v-for="(option, i) in options" v-bind:key="i">{{option}}</button>
      </div>
      <div v-show="states.result"><button v-on:click="leave()">离开房间</button></div>
    </div>
    <hr>
    <div>当前状态：{{states}}</div>
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
  Event,
  ReceiverGroup,
  CustomEventData
} from "@leancloud/play";
import Player from './Player.vue';
import { Action, actions, initialStates } from "../../rps-game-rules";
import { createGame } from "../../stateful-game/client";
import { jsonfyPlayers } from "../utils";

const game = createGame({
  client: play,
  initialStates,
  actions,
});

@Component({
  components: {
    Player,
  }
})
export default class Game extends Vue {
  logs: string[] = [];
  options = ["✊", "✌️", "✋"];
  states = game.states;
  players = jsonfyPlayers(game.players);

  get opponent() {
    const index = this.players.findIndex(player => !player.isLocal && !player.isMaster);
    if (index === -1) return {};
    return {
      choice: this.states.choices[index],
      userId: this.players[index].userId,
    };
  }

  get localPlayer() {
    const index = this.players.findIndex(player => player.isLocal);
    return {
      choice: this.states.choices[index],
      userId: this.players[index].userId,
    };
  }

  mounted() {
    // 加入 Room 并等待玩家加入，等待 masterClient 宣布游戏开始
    play.on(Event.PLAYER_ROOM_JOINED, ({ newPlayer }) => {
      this.players = jsonfyPlayers(game.players);
      this.log(`${newPlayer.userId} 加入了房间`, "Play");
    });
    play.on(Event.PLAYER_ROOM_LEFT, ({ leftPlayer }) => {
      this.log(`${leftPlayer.userId} 离开了房间`, "Play");
    });
    game.on("states-update", (states) => {
      this.states = states;
      this.log(`状态变更为: ${JSON.stringify(states)}`, "Game");
    });
  }

  private choose(index: number) {
    game.dispatchAction(Action.PLAY, {index});
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
