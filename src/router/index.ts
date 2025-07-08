import { createRouter, createWebHistory } from 'vue-router'
import Index from '../view/index/index.vue'
import Chat from '../view/chat/index.vue'
import DataSet from '../view/dataset/index.vue'
import Log from '../view/log/index.vue'
import Setting from '../view/setting/index.vue'

const routes = [
    {
        path: '/',
        name: 'Index',
        component: Index
    },
    {
        path: '/chat',
        name: 'Chat',
        component: Chat
    },
    {
        path: '/dataSet',
        name: 'DataSet',
        component: DataSet
    },
    {
        path: '/log',
        name: 'Log',
        component: Log
    },
    {
        path: '/setting',
        name: 'Setting',
        component: Setting
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
