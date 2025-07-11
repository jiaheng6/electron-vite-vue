<template>
  <div class="chat-page">
    <BubbleList :list="list" />
    <Sender />
  </div>
</template>
<script>
import { BubbleList, Sender } from 'vue-element-plus-x'
export default {
  name: 'Chat',
  components: {
    BubbleList
  },
  data () {
    return {
      list: [
        {
          content: 'Hello, Element Plus X',
          role: 'user',
        },
      ]
    }
  }
}
</script>
<style lang="scss" scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  justify-content: space-between;
}
</style>
