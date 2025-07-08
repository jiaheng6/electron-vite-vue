<template>
  <div class="log-page">
    <div class="action-group">
      <el-form-item>
        <el-button type="primary" @click="openFile">载入</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="danger" @click="clearAll">清除全部</el-button>
      </el-form-item>
      <el-form>
        <el-form-item label="" width="150px">
          <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              :shortcuts="shortcuts"
              range-separator=" ~ "
              start-placeholder="开始时间"
              end-placeholder="结束时间"
          />
        </el-form-item>
      </el-form>
    </div>
    <div id="container" class="code-box"></div>
  </div>
</template>
<script>
const PROMPT_TEXT = ''
import {EditorView} from "@codemirror/view"
import {basicSetup} from "codemirror"
export default {
  name: 'log-page',
  components: {},
  data () {
    return {
      view: null,
      dateRange: '',
      shortcuts: [
        {
          text: '近一周',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - 7)
            return [start, end]
          },
        },
        {
          text: '近一月',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setMonth(start.getMonth() - 1)
            return [start, end]
          },
        },
        {
          text: '近三个月',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setMonth(start.getMonth() - 3)
            return [start, end]
          },
        }
      ]
    }
  },
  mounted() {

  },
  methods: {
    initEditor(text) {
      this.view = new EditorView({
        parent: document.querySelector("#container"),
        doc: text,
        extensions: [basicSetup, EditorView.lineWrapping, EditorView.theme({
          ".cm-content, .cm-gutter": {textAlign: "left"}
        })]
      })
    },
    async openFile () {
      let { originText, list } = await window.ipcRenderer.invoke('log:askForReg')
      this.initEditor(originText)
      console.log('openFile--19--❀---> ', list)
      /*
      * 1. 截取前20条日志，大模型识别分割规则，给出正则表达式
      * 2. 使用正则表达式分割20条示例日志，标记每一项的名称和数据类型，选择出【时间、普通文本】
      * 3. 读取分析日志
      * 4. 渲染数据，根据不同的筛选条件和数据类型筛选
      * */
    },
    async clearAll () {
      let { data, msg } = await window.ipcRenderer.invoke('log:clearAllLog')
      console.log('clearAll--94--❀---> ', data, msg)
    }
  }
}
</script>
<style lang="scss" scoped>
.log-page {
  width: 100%;
  height: 100%;
  .action-group {
    width: 100%;
    height: 50px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  .code-box {
    width: 100%;
    height: calc(100% - 50px);
    overflow-y: scroll;
  }
}
</style>
