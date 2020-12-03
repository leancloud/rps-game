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
        <Login v-if="status == 'LOGIN'" :on-login="onLogin"></Login>
        <Lobby
          v-if="status == 'LOBBY'"
          :mode.sync="mode"
          :user-id="client.userId"
          :on-join-room="onJoinRoom"
        ></Lobby>
        <template v-if="status == 'GAME'">
          <GameVanilla
            v-if="mode == modes.Vanilla"
            :client="client"
            :on-left-room="onLeftRoom"
          ></GameVanilla>
          <GameRedux
            v-if="mode == modes.Redux"
            :client="client"
            :on-left-room="onLeftRoom"
          ></GameRedux>
          <GameXstate
            v-if="mode == modes.Xstate"
            :client="client"
            :on-left-room="onLeftRoom"
          ></GameXstate>
        </template>
      </div>
    </section>

    <a class="github-fork-ribbon" href="https://github.com/leancloud/rps-game" data-ribbon="GitHub" title="GitHub">GitHub</a>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Client, Event } from "@leancloud/play";
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
  client: Client | null = null;

  mounted() {
    document.title = this.logo + " RPSGame";
  }

  private onLogin(client: Client) {
    this.client = client;
    this.client.connect()
      .then(() => (this.status = "LOBBY"))
      .catch(errorHandler);
  }

  private onJoinRoom(roomName: string) {
    this.client?.joinRoom(roomName)
      .then(() => (this.status = "GAME"))
      .catch(errorHandler);
  }

  private onLeftRoom() {
    this.client?.leaveRoom()
      .then(() => (this.status = "LOBBY"))
      .catch(errorHandler);
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
