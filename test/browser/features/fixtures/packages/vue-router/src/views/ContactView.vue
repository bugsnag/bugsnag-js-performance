<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div>
    <h1>Contact {{ $route.params.contactId }}</h1>
  </div>
  <RouterLink id="profile" :to="{ name: 'profile' }">Profile</RouterLink>
  <RouterView />
</template>

