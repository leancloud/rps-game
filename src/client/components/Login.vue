<template>
  <form id="login" v-on:submit.prevent="login">
    <details>
      <summary>Configs</summary>
      <label>APP_ID:
        <input type="text" v-model="configs.appId" required/>
      </label><br/>
      <label>APP_KEY:
        <input type="text" v-model="configs.appKey" required/>
      </label><br/>
      <label>Client Engine Server:
        <input type="text" v-model="configs.clientEngineServer"/>
      </label><br/>
    </details><br/>
    <label>ID:
      <input type="text" v-model="id" required placeholder="[A-Za-z0-9_]{1,36}"/>
    </label><br/>
    <button type="submit">Login to Play</button>
  </form>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { play, Event } from "@leancloud/play";
import { listen } from "../utils";
import { configs, REGION } from "../configs";

@Component
export default class Login extends Vue {
  id = Date.now().toString();
  configs = configs;

  login() {
    play.init({
      appId: configs.appId,
      appKey: configs.appKey,
      region: REGION
    });

    play.userId = this.id;
    play.connect();
  }
}
</script>

<style>
</style>
