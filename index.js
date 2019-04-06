import ACTable from './components/ac-table.vue'
const plugin = {
  install (Vue, options) {
    Vue.component('ac-table', ACTable)
  }
}

export default plugin
