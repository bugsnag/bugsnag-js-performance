<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink id="change-route" to="/contacts/1">change-route</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>
