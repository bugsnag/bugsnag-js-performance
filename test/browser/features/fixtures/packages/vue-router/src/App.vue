<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <br />
      <RouterLink id="contact" to="/contacts/1">Contact</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>
