<template>
  <div id="app">
    <h2>Client Engine Demo</h2>
    <Login v-if="status == 'LOGIN'"></Login>
    <Lobby v-if="status == 'LOBBY'"></Lobby>
    <GameRedux v-if="status == 'GAME'"></GameRedux>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { play, Event } from "@leancloud/play";
import Login from "./components/Login.vue";
import Lobby from "./components/Lobby.vue";
import GameRedux from "../games/rps-game-redux/Client.vue";
import { errorHandler } from "./utils";

@Component({
  components: {
    Login,
    Lobby,
    GameRedux,
  }
})
export default class App extends Vue {
  status = "LOGIN";

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
  }
}
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  font-size: 32px;
}
button,
input {
  font-size: 32px;
}
details,
details input {
  font-size: 60%;
}
</style>
