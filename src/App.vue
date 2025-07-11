<template>
  <div class="app-container">
    <Menu @onChangeMenuItem="onChangeMenuItem"></Menu>
    <div class="content">
      <keep-alive>
        <router-view v-if="$route.meta.keepAlive" />
      </keep-alive>
      <router-view v-if="!$route.meta.keepAlive" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import HelloWorld from './components/HelloWorld.vue'
import Menu from "./components/Menu.vue";
const onChangeMenuItem = () => {
  console.log('onChangeMenuItem--16--❀---> ')
}
</script>

<style lang="scss" scoped>
.app-container {
  width: 100vw; //
  height: 100vh;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: nowrap;
  .content {
    width: calc(100vw - 200px);
    height: 100%;
    padding: 10px 20px;
    box-sizing: border-box;
  }
}
</style>
