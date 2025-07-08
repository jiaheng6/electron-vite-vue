<template>
  <div class="log-page">
    <el-button type="primary" @click="openFile">打开</el-button>
  </div>
</template>
<script>
const PROMPT_TEXT = ''
export default {
  name: 'log-page',
  components: {},
  data () {
    return {

    }
  },
  methods: {
    async openFile () {
      let regText = await window.ipcRenderer.invoke('log:askForReg')
      console.log('openFile--19--❀---> ', regText)
      /*
      * 1. 截取前20条日志，大模型识别分割规则，给出正则表达式
      * 2. 使用正则表达式分割20条示例日志，标记每一项的名称和数据类型，选择出【时间、普通文本】
      * 3. 读取分析日志
      * 4. 渲染数据，根据不同的筛选条件和数据类型筛选
      * */
    }
  }
}
</script>
<style lang="scss" scoped>
.log-page {

}
</style>
