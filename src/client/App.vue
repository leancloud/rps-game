<template>
  <div id="app" class="content">
    <section class="hero is-info">
      <div class="hero-body">
        <div class="container has-text-centered">
          <h1 class="title">
            {{logo}} RPSGame
          </h1>
          <h2 class="subtitle is-6">
            A LeanCloud ClientEngine sample
          </h2>
        </div>
      </div>
    </section>

    <div v-if="status == 'GAME'" class="mode">Mode: {{mode}}</div>

    <section class="section">
      <div class="container">
        <Login v-if="status == 'LOGIN'"></Login>
        <Lobby v-if="status == 'LOBBY'" v-bind:mode.sync="mode"></Lobby>
        <template v-if="status == 'GAME'">
          <GameVanilla v-if="mode == modes.Vanilla"></GameVanilla>
          <GameRedux v-if="mode == modes.Redux"></GameRedux>
          <GameXstate v-if="mode == modes.Xstate"></GameXstate>
        </template>
      </div>
    </section>

    <a class="github-fork-ribbon" href="https://github.com/leancloud/rps-game" data-ribbon="GitHub" title="GitHub">GitHub</a>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { play, Event } from "@leancloud/play";
import Login from "./components/Login.vue";
import Lobby from "./components/Lobby.vue";
import { GameMode } from "../games/types";
import { options } from "../games/models";
import GameVanilla from "../games/rps-game-vanilla/Client.vue";
import GameRedux from "../games/rps-game-redux/Client.vue";
import GameXstate from "../games/rps-game-xstate/Client.vue";
import { errorHandler } from "./utils";

@Component({
  components: {
    Login,
    Lobby,
    GameVanilla,
    GameRedux,
    GameXstate,
  }
})
export default class App extends Vue {
  status = "LOGIN";
  modes = GameMode;
  mode = GameMode.Vanilla;

  logo = options[Math.floor(Math.random() * 3)];

  mounted() {
    play.on(Event.CONNECTED, () => {
      this.status = "LOBBY";
    });
    play.on(Event.CONNECT_FAILED, errorHandler);
    play.on(Event.ROOM_JOINED, () => {
      this.status = "GAME";
    });
    play.on(Event.ROOM_JOIN_FAILED, errorHandler);
    play.on(Event.ROOM_LEFT, () => {
      this.status = "LOBBY";
    });

    document.title = this.logo + ' RPSGame';
  }
}
</script>

<style>
summary {
  text-align: center;
  font-size: 0.8em;
  margin: 0.5em 0;
}
.mode{
  position: absolute;
  right: 0;
  padding: 0.25em;
}

.desk {
  padding-top: 4px;
  padding-bottom: 4px;
  font-size: 120%;
}
.desk-info {
  margin: 2em 4px !important;
}
.desk .level-item {
  flex-direction: column;
}

.github-fork-ribbon:before,
.github-fork-ribbon:after {
  top: 1.23em;
  right: -5.23em;
}
.github-fork-ribbon:before {
  background-color: #209cee;
}
</style>
