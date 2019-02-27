<template>
  <details open>
    <summary>当前状态</summary>
    <pre><code>{{formattedState}}</code></pre>
  </details>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class State extends Vue {
  
  @Prop()
  state: any;
  
  get formattedState() {
    return JSON.stringify(this.state, undefined, 2);
  }
}
</script>
