<script setup>
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

onMounted(() => { document.title = 'Contact 1'; })
</script>

<template>
  <div>
    <h1>Contact {{ $route.params.contactId }}</h1>
  </div>
  <RouterLink id="profile" :to="{ name: 'profile' }">Profile</RouterLink>
  <RouterView />
</template>

