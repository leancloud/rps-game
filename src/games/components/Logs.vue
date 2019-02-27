<template>
  <details open>
    <summary>日志</summary>
    <div class="logs">
      <div v-for="(log, index) in formattedLogs" v-bind:key="index">
        <span class="tag is-dark">+{{log.timestamp}}</span>
        <span class="tag" v-for="tag in log.tags" v-bind:key="tag">{{tag}}</span>
        {{log.content}}
      </div>
    </div>
  </details>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { ILog } from "./types";


@Component
export default class Logs extends Vue {
  
  @Prop()
  logs!: ILog[];
  
  get formattedLogs() {
    if (!(this.logs && this.logs[0])) {
      return;
    }
    let time = this.logs[0].timestamp;
    return this.logs.map((log) => {
      const diff = log.timestamp - time;
      time = log.timestamp;
      return {
        ...log,
        lables: log.tags || [],
        timestamp: diff,
      }
    });
  }
}
</script>

<style>
.logs {
  overflow: auto;
  white-space: nowrap;
}
</style>
