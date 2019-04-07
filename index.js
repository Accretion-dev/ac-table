import ACInput from 'ac-input'
import ACTable from './components/ac-table.vue'
const plugin = {
  install (Vue, options) {
    Vue.use(ACInput)
    Vue.component('ac-table', ACTable)
  }
}

export default plugin
