<template>
  <form id="login" v-on:submit.prevent="login">
    <div class="field">
      <label class="label">ID
        <div class="control">
          <input class="input" type="text" v-model="id" required placeholder="[A-Za-z0-9_]{1,36}"/>
        </div>
      </label>
    </div>

    <div class="field is-grouped is-grouped-centered">
      <div class="control">
        <button type="submit" class="button is-info">
          Login to Play
        </button>
      </div>
    </div>

    <details class="is-small">
      <summary>Configs</summary>

      <div class="field">
        <label class="label is-small">APP_ID
          <div class="control">
            <input class="input is-small" v-model="configs.appId" required/>
          </div>
        </label>
      </div>
      <div class="field">
        <label class="label is-small">APP_KEY
          <div class="control">
            <input class="input is-small" v-model="configs.appKey" required/>
          </div>
        </label>
      </div>
      <div class="field">
        <label class="label is-small">API_SERVER
          <div class="control">
            <input class="input is-small" v-model="configs.apiServer" required/>
          </div>
        </label>
      </div>
      <div class="field">
        <label class="label is-small">Client Engine Server
          <div class="control">
            <input class="input is-small" v-model="configs.clientEngineServer"/>
          </div>
        </label>
      </div>
    </details>
  </form>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Client } from "@leancloud/play";
import { configs } from "../configs";

@Component
export default class Login extends Vue {
  @Prop() onLogin!: (client: Client) => void;

  id = Date.now().toString();
  configs = configs;

  login() {
    const client = new Client({
      appId: configs.appId,
      appKey: configs.appKey,
      playServer: configs.apiServer,
      userId: this.id,
    });
    this.onLogin(client);
  }
}
</script>

<style>
#login {
  max-width: 320px;
  margin: 0 auto;
}
</style>
