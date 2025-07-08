<template>
    <el-container class="container">
      <el-header>
        <div class="search">
          <el-form :inline="true" :model="search" class="form-inline">
            <el-form-item>
              <el-input v-model="search.user" placeholder="请输入名称" clearable/>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="queryList">查询</el-button>
              <el-button type="default" @click="onSubmit">添加</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-header>
      <el-main class="card-container">
        <el-table :data="list" style="width: 100%">
          <el-table-column fixed prop="name" label="名称"/>
          <el-table-column prop="description" label="描述"/>
          <el-table-column prop="document_count" label="文档数"/>
          <el-table-column prop="char_length" label="字符数"/>
          <el-table-column prop="is_active" label="是否启用"/>
          <el-table-column fixed="right" label="操作" min-width="120">
            <template #default>
              <el-button link type="primary" size="small" @click="handleClick">
                详情
              </el-button>
              <el-button link type="primary" size="small">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-main>
      <el-footer>
        <el-pagination
            v-model:current-page="page.currentPage"
            v-model:page-size="page.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :size="'default'"
            :disabled="false"
            :background="false"
            layout="total, sizes, prev, pager, next, jumper"
            :total="page.total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </el-footer>
      <el-dialog v-model="dialogFormVisible" title="添加" width="500">
        <el-form :model="form">
          <el-form-item label="知识库名称" label-width="140px">
            <el-input v-model="form.name" autocomplete="off" />
          </el-form-item>
          <el-form-item label="知识库描述" label-width="140px">
            <el-input v-model="form.description" autocomplete="off" />
          </el-form-item>
          <el-form-item label="向量模型" label-width="140px">
            <el-select v-model="form.model_id" placeholder="Please select a zone">
              <el-option label="Zone No.1" value="shanghai" />
              <el-option label="Zone No.2" value="beijing" />
            </el-select>
          </el-form-item>
          <el-form-item label="是否启用" label-width="140px">
            <el-input v-model="form.is_active" autocomplete="off" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogFormVisible = false">取消</el-button>
            <el-button type="primary" @click="save">
              保存
            </el-button>
          </div>
        </template>
      </el-dialog>
    </el-container>
</template>
<script>
export default {
  name: 'DataSet',
  data () {
    return {
      search: {
        user: '',
        region: '',
        date: '',
      },
      page: {
        currentPage: 1,
        pageSize: 10,
        total: 0,
      },
      dialogFormVisible: false,
      form: {
        name: '',
        description: '',
        model_id: '',
        is_active: false
      },
      list: []
    }
  },
  mounted() {
    this.queryList()
  },
  methods: {
    onSubmit () {
      this.dialogFormVisible = true
    },
    async queryList () {
      let { data, total, page, pageSize } = await window.ipcRenderer.invoke('dataset:paginate', {
        page: this.page.currentPage,
        size: this.page.pageSize,
      })
      this.list = data
      this.page = {
        currentPage: page,
        pageSize: pageSize,
        total: total,
      }
      console.log('queryList--126--❀---> ', this.list)
    },
    handleSizeChange(e) {
      this.page.pageSize = e
      this.page.currentPage = 1
      this.queryList()
    },
    handleCurrentChange(page) {
      this.page.currentPage = page
      this.queryList()
    },
    handleClick () {},
    async save () {
      this.dialogFormVisible = false
      await window.ipcRenderer.invoke('dataset:add', {
        ...this.form
      })
      await this.queryList()
    },
  }
}
</script>
<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  .search {
    width: 100%;
    height: 200px;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .card-container {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-wrap: wrap;
    .card-item {
      width: 320px;
      height: 200px;
      border-radius: 8px;
      margin: 7.5px;
    }
  }
}
</style>
