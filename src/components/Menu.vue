<template xmlns="">
  <div class="app-menu">
    <el-row class="tac">
      <el-col :span="24">
        <el-menu
            active-text-color="#ffd04b"
            background-color="#545c64"
            class="el-menu-vertical-demo"
            default-active="1"
            text-color="#fff"
            :router="true"
            @open="handleOpen"
            @close="handleClose"
        >
          <el-menu-item index="/chat" @click="selectMenuItem">
            <el-icon><DocumentAdd /></el-icon>
            <span>对话</span>
          </el-menu-item>
          <el-menu-item index="/dataSet">
            <el-icon><IconMenu /></el-icon>
            <span>知识库</span>
          </el-menu-item>
          <el-menu-item index="3">
            <el-icon><Document /></el-icon>
            <span>提示词</span>
          </el-menu-item>
          <el-menu-item index="4">
            <el-icon><setting /></el-icon>
            <span>设置</span>
          </el-menu-item>
        </el-menu>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import {
  Document,
  DocumentAdd,
  Menu as IconMenu,
  Location,
  Setting,
} from '@element-plus/icons-vue'
export default {
  name: 'Menu',
  components: {
    Location,
    Setting,
    IconMenu,
    Document,
    DocumentAdd
  },
  data () {
    return {

    }
  },
  methods: {
    handleOpen (key, keyPath) {
      console.log(key, keyPath)
    },
    handleClose (key, keyPath) {
      console.log(key, keyPath)
    },
    selectMenuItem () {
      console.log('selectMenuItem--54--❀---> ')
    }
  }
}
</script>
<style lang="scss" scoped>
.app-menu {
  width: 200px;
  height: 100%;
  background-color: #545c64;
}
</style>
