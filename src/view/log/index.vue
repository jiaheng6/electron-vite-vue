<template>
  <div class="log-page">
    <div class="action-group">
      <el-form :inline="true">
        <el-form-item>
          <el-button type="primary" @click="openFile">载入文件</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="default" @click="clearEditor">清除内容</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="danger" @click="clearAll">清除记录</el-button>
        </el-form-item>
        <el-form-item label="" width="150px">
          <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              :shortcuts="shortcuts"
              range-separator=" ~ "
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="queryData"
          />
        </el-form-item>
        <el-form-item>
          <el-radio-group v-model="sortType" @change="queryData">
            <el-radio-button label="正序" value="ascend" />
            <el-radio-button label="倒序" value="descend" />
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-input v-model="searchText" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="queryData">查询</el-button>
          <el-button type="default" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-tabs
        v-model="currentDocName"
        type="card"
        closable
        class="tabs-container"
        @edit="handleTabsEdit"
    >
      <el-tab-pane
          v-for="item in editableTabs"
          :key="item.name"
          :label="item.title"
          :name="item.name"
          class="tab-item"
      >
        <template #default>
          <el-scrollbar class="code-box" :id="'code-box' + item.name">
            <div :id="'container' + item.name"></div>
          </el-scrollbar>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>
const PROMPT_TEXT = ''
import {EditorView, showDialog} from "@codemirror/view"
import {basicSetup} from "codemirror"
import { ElLoading } from 'element-plus'

export default {
  name: 'log-page',
  components: {},
  data() {
    return {
      view: {},
      dateRange: '',
      shortcuts: [
        {
          text: '近5分钟',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setMinutes(start.getMinutes() - 5)
            return [start, end]
          },
        },
        {
          text: '近10分钟',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setMinutes(start.getMinutes() - 10)
            return [start, end]
          },
        },
        {
          text: '近30分钟',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setMinutes(start.getMinutes() - 30)
            return [start, end]
          },
        },
        {
          text: '近1小时',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setHours(start.getHours() - 1)
            return [start, end]
          },
        },
        {
          text: '近2小时',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setHours(start.getHours() - 2)
            return [start, end]
          },
        },
        {
          text: '近1天',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - 1)
            return [start, end]
          },
        },
        {
          text: '近3天',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - 3)
            return [start, end]
          },
        },
        {
          text: '近1周',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - 7)
            return [start, end]
          },
        }
      ],
      editorVal: '', // 编辑器内容
      logTableName: '',
      searchText: '',
      isLoading: false,
      sortType: 'descend',
      progress: 0,
      loadingService: null,
      currentDocName: 0,
      editableTabs: []
    }
  },
  beforeRouteLeave(to,from,next){
    to.meta.keepAlive = true
    next(0)
  },
  mounted() {
    window.ipcRenderer.on('log-insert-chunk', (event, data) => {
      // let newVal = ''
      // data.batch.forEach(item => {
      //   newVal = newVal + item.content + '\n'
      // })
      // this.editorVal = this.editorVal + newVal
      // this.updateEditor(this.editorVal)
      let { progress } = data
      this.progress = progress
      this.loadingService.setText(`文件载入中...处理进度${this.progress}%...`)
    })
  },
  computed: {
    // 是否是第一次打开
    isFirstOpen () {
      return !this.editableTabs.find(t => t.name === this.logTableName)
    }
  },
  watch: {
    isLoading(val) {
      if (val) {
        this.loadingService = ElLoading.service({
          target: document.getElementById('code-box' + this.currentDocName),
          fullscreen: false,
          text: '文件载入中...处理进度0%...'
        })
      } else {
        if (this.loadingService) {
          this.loadingService.close()
        }
      }
    }
  },
  methods: {
    async initEditor() {
      console.log('initEditor--196--❀---> ', '#container' + this.currentDocName, document.querySelector('#container' + this.currentDocName))
      await this.$nextTick();
      const container = document.querySelector(`#container${this.currentDocName}`);
      if (container && !this.view[this.currentDocName]) {
        this.view[this.currentDocName] = new EditorView({
          parent: document.querySelector('#container' + this.currentDocName),
          doc: '',
          extensions: [basicSetup, EditorView.lineWrapping, EditorView.theme({
            ".cm-content, .cm-gutter": {textAlign: "left"}
          }), EditorView.domEventHandlers({
            contextmenu: (event, view) => {
              event.preventDefault();
              const selection = view.state.selection;
              if (!selection.empty) {
                const selectedText = view.state.doc.sliceString(selection.main.from, selection.main.to);
                const menu = document.createElement('div');
                menu.style.position = 'absolute';
                menu.style.left = `${event.clientX}px`;
                menu.style.top = `${event.clientY}px`;
                menu.style.background = 'white';
                menu.style.border = '1px solid #ccc';
                menu.style.padding = '5px';
                menu.style.zIndex = '1000';
                menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

                const menuItem = document.createElement('div');
                menuItem.textContent = '筛选选中部分';
                menuItem.style.padding = '8px 12px';
                menuItem.style.cursor = 'pointer';
                menuItem.style.margin = '2px 0';
                menuItem.style.border = '1px solid #ddd';
                menuItem.style.borderRadius = '4px';
                menuItem.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                menuItem.style.transition = 'all 0.2s';
                menuItem.addEventListener('mouseover', () => {
                  menuItem.style.background = '#f5f5f5';
                  menuItem.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                });
                menuItem.addEventListener('mouseout', () => {
                  menuItem.style.background = 'white';
                  menuItem.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                });
                menuItem.addEventListener('click', () => {
                  this.searchText = selectedText;
                  menu.remove();
                  this.queryData()
                });

                const aiMenuItem = document.createElement('div');
                aiMenuItem.textContent = '问AI';
                aiMenuItem.style.padding = '8px 12px';
                aiMenuItem.style.cursor = 'pointer';
                aiMenuItem.style.margin = '2px 0';
                aiMenuItem.style.border = '1px solid #ddd';
                aiMenuItem.style.borderRadius = '4px';
                aiMenuItem.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                aiMenuItem.style.transition = 'all 0.2s';
                aiMenuItem.addEventListener('mouseover', () => {
                  aiMenuItem.style.background = '#f5f5f5';
                  aiMenuItem.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                });
                aiMenuItem.addEventListener('mouseout', () => {
                  aiMenuItem.style.background = 'white';
                  aiMenuItem.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                });
                aiMenuItem.addEventListener('click', () => {
                  menu.remove();
                  this.queryAI(selectedText)
                });

                const baiduMenuItem = document.createElement('div');
                baiduMenuItem.textContent = '问百度';
                baiduMenuItem.style.padding = '8px 12px';
                baiduMenuItem.style.cursor = 'pointer';
                baiduMenuItem.style.margin = '2px 0';
                baiduMenuItem.style.border = '1px solid #ddd';
                baiduMenuItem.style.borderRadius = '4px';
                baiduMenuItem.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                baiduMenuItem.style.transition = 'all 0.2s';
                baiduMenuItem.addEventListener('mouseover', () => {
                  baiduMenuItem.style.background = '#f5f5f5';
                  baiduMenuItem.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                });
                baiduMenuItem.addEventListener('mouseout', () => {
                  baiduMenuItem.style.background = 'white';
                  baiduMenuItem.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                });
                baiduMenuItem.addEventListener('click', () => {
                  menu.remove();
                  window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(selectedText)}`);
                });

                const copyMenuItem = document.createElement('div');
                copyMenuItem.textContent = '复制选中';
                copyMenuItem.style.padding = '8px 12px';
                copyMenuItem.style.cursor = 'pointer';
                copyMenuItem.style.margin = '2px 0';
                copyMenuItem.style.border = '1px solid #ddd';
                copyMenuItem.style.borderRadius = '4px';
                copyMenuItem.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                copyMenuItem.style.transition = 'all 0.2s';
                copyMenuItem.addEventListener('mouseover', () => {
                  copyMenuItem.style.background = '#f5f5f5';
                  copyMenuItem.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                });
                copyMenuItem.addEventListener('mouseout', () => {
                  copyMenuItem.style.background = 'white';
                  copyMenuItem.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                });
                copyMenuItem.addEventListener('click', () => {
                  navigator.clipboard.writeText(selectedText);
                  menu.remove();
                });

                menu.appendChild(menuItem);
                menu.appendChild(aiMenuItem);
                menu.appendChild(baiduMenuItem);
                menu.appendChild(copyMenuItem);
                document.body.appendChild(menu);

                const closeMenu = (e) => {
                  if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                  }
                };
                document.addEventListener('click', closeMenu);
              }
            }
          })]
        })
        console.log('initEditor--328--❀---> 初始化编辑器完成', this.view)
      } else {
        console.log('initEditor--333--❀---> ', container)
      }
    },
    async updateEditor(text) {
      if (!this.view[this.currentDocName]) {
        this.$message.error('创建编辑器失败')
        return;
      }
      console.log('updateEditor--325--❀---> ', text.length, this.view)
      this.view[this.currentDocName].dispatch({
        changes: {
          from: 0,
          to: this.view[this.currentDocName].state.doc.length,
          insert: text
        }
      })
    },
    async openFile() {
      this.isLoading = true
      let { data, msg } = await window.ipcRenderer.invoke('log:askForReg')
      console.log('openFile--19--❀---> 加载完成', data)
      this.isLoading = false
      if (data) {
        this.logTableName = data
        await this.queryData()
        // this.$message.success(msg)
      }
      /*
      * 1. 截取前20条日志，大模型识别分割规则，给出正则表达式
      * 2. 使用正则表达式分割20条示例日志，标记每一项的名称和数据类型，选择出【时间、普通文本】
      * 3. 读取分析日志
      * 4. 渲染数据，根据不同的筛选条件和数据类型筛选
      * */
    },
    async clearAll() {
      let {data, msg} = await window.ipcRenderer.invoke('log:clearAllLog')
      console.log('clearAll--94--❀---> 清理完成', data, msg)
    },
    async clearEditor() {
      this.editorVal = ''
      this.updateEditor('')
    },
    async queryData () {
      this.isLoading = true
      try {
        let {data, msg} = await window.ipcRenderer.invoke('log:query', {
          tableName: this.logTableName,
          startTime: this.dateRange ? this.dateRange[0] : '',
          endTime: this.dateRange ? this.dateRange[1] : '',
          searchText: this.searchText,
          sortType: this.sortType,
        })
        this.$message.info(msg)
        this.editorVal = data.map(t => t.content).join('\n')
        console.log('queryData--376--❀---> 判断是否是第一次打开', this.isFirstOpen)
        if (this.isFirstOpen) {
          console.log('queryData--377--❀---> 第一次打开', this.logTableName)
          this.editableTabs.push({
            title: this.logTableName,
            name: this.logTableName
          })
          this.currentDocName = this.logTableName
          await this.$nextTick()
          await this.initEditor()
        }
        await this.updateEditor(this.editorVal)
      } catch (e) {
        console.log('queryData--236--❀---> ', e)
      } finally {
        this.isLoading = false
      }
    },
    reset () {
      this.dateRange = []
      this.searchText = ''
      this.clearEditor()
      this.queryData()
    },
    queryAI (text) {
      console.log('queryAI--297--❀---> ', text)
    },
    async handleTabsEdit (targetName, action) {
      if (action === 'add') {
        // const newTabName = `${++this.tabIndex}`
        // this.editableTabs.push({
        //   title: 'New Tab',
        //   name: newTabName,
        //   content: 'New Tab content',
        // })
        // this.currentDocName = newTabName
      } else if (action === 'remove') {
        console.log('handleTabsEdit--426--❀---> ', targetName)
        // await window.ipcRenderer.invoke('log:deleteLog', )
        const tabs = this.editableTabs
        let activeName = this.currentDocName
        if (activeName === targetName) {
          tabs.forEach((tab, index) => {
            if (tab.name === targetName) {
              const nextTab = tabs[index + 1] || tabs[index - 1]
              if (nextTab) {
                activeName = nextTab.name
              }
            }
          })
        }
        this.currentDocName = activeName
        this.editableTabs = tabs.filter((tab) => tab.name !== targetName)
      }
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
    height: 100px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  .tabs-container {
    width: 100%;
    height: calc(100% - 100px);
    .tab-item {
      width: 100%;
      height: calc(100% - 50px);
    }
    .code-box {
      width: 100%;
      height: 100%;
      overflow-y: scroll;
    }
  }
}
</style>
