import Vue from 'vue'
import Router from 'vue-router'
import Check from '@/components/Check'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      component: Check
    }
  ]
})
