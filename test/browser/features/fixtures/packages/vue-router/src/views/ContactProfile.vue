<script setup>
import { onMounted } from 'vue'

onMounted(() => { document.title = 'Contact Profile'; })
</script>

<template>
  <div>
    <h1>Contact {{ $route.params.contactId }} Profile</h1>
  </div>
</template>

