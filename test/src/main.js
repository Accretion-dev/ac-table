import Vue from 'vue'
import App from './App.vue'
import ACTable from '../../index.js'

Vue.config.productionTip = false
Vue.use(ACTable)

new Vue({
  render: h => h(App),
}).$mount('#app')
