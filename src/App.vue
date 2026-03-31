<script setup lang="ts">
import {useCounterStore} from "@/stores/counter.ts";
import ChatBot from "@/components/ChatBot.vue";

const counterStore = useCounterStore();

counterStore.increment()
</script>

<template>
  <ChatBot></ChatBot>
</template>

<style scoped></style>
