<template>
    <el-container class="container">
      <el-header>
        <div class="search">
          <el-form :inline="true" :model="form" class="form-inline">
            <el-form-item>
              <el-input v-model="form.user" placeholder="请输入名称" clearable/>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="onSubmit">查询</el-button>
              <el-button type="default" @click="onSubmit">添加</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-header>
      <el-main class="card-container">
        <el-card v-for="item in dataSetList" :key="item.id" shadow="hover" class="card-item">
          {{ item.name }}
        </el-card>
      </el-main>
      <el-footer>Footer</el-footer>
    </el-container>
</template>
<script>
export default {
  name: 'DataSet',
  data () {
    return {
      form: {
        user: '',
        region: '',
        date: '',
      },
      dataSetList: [
        {
          id: '1',
          name: 'Test01',
          description: '',
          info: {
            count: 0, // 字符数量
            article: 0, // 文档数量
          }
        },
        {
          id: '2',
          name: 'Test02',
          description: '',
          info: {
            count: 0, // 字符数量
            article: 0, // 文档数量
          }
        }
      ]
    }
  },
  methods: {
    onSubmit () {}
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
