<template>
  <div>
    <div class="level desk">
      <div class="level-left" v-if="state.started">
        <div class="level-item">
          <span class="tag ">对手</span>
          <Player v-if="opponent" :player="opponent" :result="state.result"></Player>
        </div>
      </div>
      <div class="level-item desk-info">
        <div v-if="!state.started">正在等待其他玩家</div>
        <Actions v-else :result="state.result" :local-player="localPlayer" :choose="choose" :leave="leave"></Actions>
      </div>
      <div class="level-right" v-if="state.started">
        <div class="level-item">
          <Player :player="localPlayer" :result="state.result"></Player>
          <span class="tag ">你</span>
        </div>
      </div>
    </div>
    <hr>
    <State :state="state"></State>
    <hr>
    <Logs :logs="logs"></Logs>
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
import { createReduxGameClient, ClientEvent } from "@leancloud/stateful-game/client";
import Player from '../components/Player.vue';
import Actions from '../components/Actions.vue';
import State from '../components/State.vue';
import Logs from '../components/Logs.vue';
import { Event, events, reducer, RPSGameState } from "./rules";
import { ValidChoice, options } from "../models";
import { jsonfyPlayers } from "../../client/utils";
import { ILog } from "../components/types";

@Component({
  components: {
    Player,
    Actions,
    State,
    Logs,
  }
})
export default class Game extends Vue {
  private game = createReduxGameClient({
    client: play,
    events,
    reducer,
  });

  logs: string[] = [];
  options = options;
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

  private log(content: string, scope = "Game") {
    this.logs.push({
      content,
      timestamp: Date.now(),
      tags: [scope],
    });
  }
}
</script>
