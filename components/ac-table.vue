<template>
  <div
    :class="`${prefixCls}`"
    tabindex="0"
    @mousedown="mousedown"
    @mouseup="mouseup"
    @mousemove="mousemove"
    @dblclick="doubleclick"
    @keydown.stop="keydown"
  >
    <div>
      <pre
        v-show="store.treeState.comments&&!loading"
        ref="tree-comments"
        :class="`${prefixCls}-tree-comments`"
      >{{ store.treeState.comments?store.treeState.comments.comments:"" }}</pre>
      <div :class="`${prefixCls}-masker`" :style="{'z-index': masker?100:-1}" />
    </div>
    <div :class="`${prefixCls}-header`">
      <span
        :class="`${prefixCls}-toolbar`"
        :style="{background: status.sidebarShow?'#d8ffd7':'unset'}"
        @click="status.sidebarShow=!status.sidebarShow"
      >
        T
      </span>
      <div :class="`${prefixCls}-sidebar-tab`" @click="clickChangeSidebar">
        <span name="tree" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='tree'}">
          <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">tree</span>
        </span>
        <span name="projection" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='projection'}">
          <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">projection</span>
        </span>
        <span name="extra" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='extra'}">
          <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">extra</span>
        </span>
      </div>
      <span @click="cleanCurrentDatabase">
        cleanCuurent
      </span>
      <span @click="cleanAllDatabase">
        cleanAll
      </span>
      <span ref="pageStatus" style="position:absolute; right:0;">
        <span>{{status.page.page}}({{status.page.start}}~{{status.page.end}})</span>{{"/"}}<span>{{status.page.maxPage}}({{status.page.length}})</span>
      </span>
    </div>
    <div :class="`${prefixCls}-main`">
      <template v-if="loading">
        <div :class="`${prefixCls}-loading`">
          loading...
        </div>
      </template>
      <template v-else>
        <div v-show="status.sidebarShow" ref="sidebar-wrapper" :class="`${prefixCls}-sidebar-wrapper`">
          <div ref="sidebar" :class="`${prefixCls}-sidebar`">
            <ac-tree
              v-show="store.status.sidebar==='tree'"
              ref="tree"
              :tree="store.tree"
              :tree-state="store.treeState"
              @update="onTreeUpdate"
            />
            <ac-tree-projection
              v-show="store.status.sidebar==='projection'"
              ref="projection"
              :projections="store.projectionFields"
            />
            <div v-show="store.status.sidebar==='extra'" ref="extra" tabindex="0">
              extra terms
            </div>
          </div>
        </div>
        <div v-show="status.sidebarShow"
             ref="resizer"
             :class="{[`${prefixCls}-resizer`]: true, [`${prefixCls}-resizer-selected`]:status.resizing}"
             :style="{'z-index': masker?999:'unset'}"
        >
          <span style="width:1px; background:gray; margin-right:2px;pointer-events: none;" />
        </div>
        <div :class="`${prefixCls}-content`">
          <div v-for="(pdata,index) in pageStrings" :key="index" :class="`${prefixCls}-print-line`">
            <span :class="`${prefixCls}-print-index`" :style="{width: `${digital}em`}">{{ index+status.page.start }}</span>
            <pre :class="`${prefixCls}-print-data`">{{ pdata }}</pre>
          </div>
        </div>
      </template>
    </div>
    <div :class="`${prefixCls}-footer`">
      <span>
        {{ data.length }}
      </span>
      <span v-show="message.show"
            :class="`${prefixCls}-status-message`"
            :style="{'font-color':`${messageColor[message.type]}`}"
      >
        {{ message.text }}
      </span>
    </div>
  </div>
</template>

<script>
const prefixCls = 'ac-table'
import {JsonAnalyser} from '../utils/jsonAnalyser.js'
import { openDB, deleteDB, wrap, unwrap } from 'idb'
import acTree from './ac-tree'
import acTreeProjection from './ac-tree-projection'
import icons from '../icons/icons.vue'

/*
TODO:
* config system
* watch change of data, struct, configs and filters
* select, keyboard of projection
* postive and negative mode of projection
* pretty printer with
  * noNewline and noPreNewline

... more type of data (root could be array or simple type)
*/

export default {
  name: 'ac-table',
  components: {acTree, acTreeProjection},
  props: {
    data: { type: Array, default () { return [] } },
    configs: { type: Object, default: null },
    struct: { type: Object, default: null },
    filters: { type: Object, default: null },
    uid: { type: String, default () { return (new Date()).toISOString() }},
  },
  data () {
    return {
      prefixCls,
      db: null,
      loading: true,
      analyser: null,
      filteredData: [],
      projectedData: {},
      pageData: [],
      projectedStrings: [],
      pageStrings: [],
      store: {
        tree: {root: true, status:{open:true}},
        treeState: {
          selected: null,
          comments: null,
        },
        extraFields: [],
        projectionFields:[],
        configs: {},
        filters: {},
        status: {
          sidebar: 'tree',
          page: 0,
          tablePage: 0,
        },
      },
      status: {
        sidebarShow: true,
        resizing: false,
        page: {
          maxPage: 0,
          length: 0,
          start: 0,
          end: 0,
          page: 0,
        }
      },
      timers: {
        updateDatabase: {
          all: null
        },
        message: null,
        treeComments: null
      },
      message: {
        text: '',
        type: 'info',
        show: false
      },
      messageColor: {
        'info': 'blue',
        'error': 'red',
      },
      defaultConfigs: {
        projection: {
          showUndefined: { type: 'boolean', default: true, },
        },
        page: {
          pageSize: { type: 'number', default: 10 },
          tablePageSize: { type: 'number', default: 100 },
        }
      }
    }
  },
  computed: {
    digital () {
      let N = this.projectedStrings.length
      let count = 1
      while(N>=1) {
        N = N/10
        count += 1
      }
      return count/2
    },
    masker () {
      return this.status.resizing
    },
    actree () {
      return this.$children.find(_ => _.$options.name === 'ac-table-tree')
    },
    defaultProjection () {
      return this.tree.children.map(_ => _.path)
    },
  },
  watch: {
    'store.treeState.comments' (value) {
      if (!value) return
      let el = this.$refs['tree-comments']
      let resizer = this.$refs.resizer
      if (!resizer || !el) return
      let y = value.y
      let x = resizer.getBoundingClientRect().x
      el.style.setProperty('left', x+"px")
      el.style.setProperty('top', y+"px")
    },
  },
  created () {
    // watch for tab change
    this.$watch('store.status.sidebar', this.focusOnSicebar)
    /** TODO
    * when data or configs or projection changed(outside)
      update store
    * when store.tree, store.projectionFields, store.filters change(inside)
      update database and the print
    */
    let dataChange = (newValue, oldValue) => {
      console.log('data changed!')
    }
    let structChange = (newValue, oldValue) => {
      console.log('struct changed!')
      this.analyser = new JsonAnalyser({tree: value})
    }
    let filtersChange = (newValue, oldValue) => {
      this.store.filters = newValue
    }
    let configsChange = (newValue, oldValue) => {
      console.log('configs changed!')
    }
    this.$watch('data', dataChange)
    this.$watch('struct',  structChange)
    this.$watch('filters', filtersChange)
    this.$watch('configs', configsChange)

    this.$watch('store.projectionFields', this.onProjectionChange)

    this.init()
  },
  mounted () {
  },
  methods: {
    async init () {
      try {
        await this.initDatabase()
        this.onFilterChange(null, null, true)
      } catch (error) {
        console.error(error)
        this.loading = false
        this.initStore()
      }
    },
    // about database and init
    async saveStore (key, tx) {
      let keys
      if (key) {
        keys = [key]
      } else {
        keys = Object.keys(this.store)
        await tx.objectStore('uids').put(this.uid, this.uid)
      }
      for (let key of keys) {
        await tx.objectStore(key).put(this.store[key], this.uid)
      }
    },
    getConfigs (config) {
      let result = {}
      for (let key of Object.keys(this.defaultConfigs)) {
        result[key] = {}
        for (let subkey of Object.keys(this.defaultConfigs[key])) {
          result[key][subkey] = this.defaultConfigs[key][subkey].default
        }
      }
      if (!config) return result
      for (let key of Object.keys(config)) {
        Object.assign(result[key], config[key])
      }
      return result
    },
    async initDatabase (initial = {}) {
      if (!window.indexedDB) {
        throw Error('no support for indexedDB')
      } else {
        let keys = Object.keys(this.store) // get all keys from default
        let db = await openDB('ac-table', 1, {
          upgrade (db, oldVersion, newVersion, transaction) {
            //db.createObjectStore('trees', { keyPath: 'uid' })
            db.createObjectStore('uids')
            for (let key of keys) {
              db.createObjectStore(key)
            }
          }
        })
        let tx = db.transaction(['uids', ...keys], 'readwrite')
        let uidsStore = tx.objectStore('uids')
        let data, uid
        uid = await uidsStore.get(this.uid)
        if (!uid) { // init the store
          // tree, treeState, extraFields, projectionFields, configs, status
          this.statusBarInfo(`gen new store`, 'info')
          this.initStore()
          await this.saveStore(null, tx)
        } else {
          this.statusBarInfo(`use old store`, 'info')
          data = {}
          for (let key of keys) {
            data[key] = await tx.objectStore(key).get(this.uid)
          }
          this.analyser = new JsonAnalyser({tree: data.tree})
          Object.assign(this.store, data)
        }
        // clean old trees
        let uids = await uidsStore.getAllKeys('uids')
        let now = new Date()
        uids = uids.filter(_ => !isNaN(new Date(_)))
        uids = uids.slice(3) // leave the latest 3 random trees
        for (let key of keys) {
          let store = tx.objectStore(key)
          for (let each of uids) {
            await this.stores.delete(each)
          }
        }
        this.db = db
        this.loading = false
        this.store.treeState.comments = null
      }
    },
    updateDatabase (fields, sync) {
      let keys = Object.keys(this.store)
      let timer = ['uids', ...keys]
      if (fields) timer = fields
      for (let field of fields) {
        clearTimeout(this.timers.updateDatabase[field])
        this.timers.updateDatabase[field] = setTimeout(async () => {
          let db = this.db
          let tx = db.transaction(field, 'readwrite')
          await this.saveStore(field, tx)
          await tx.done
          //this.statusBarInfo(`save ${field}`, 'info')
          console.log(`save ${field}`)
        }, 1000)
      }
    },
    async cleanCurrentDatabase (field) {
      let keys = Object.keys(this.store)
      let db = this.db
      let tx = db.transaction(['uids',...keys], 'readwrite')
      let uidsStore = tx.objectStore('uids')
      let exists = await uidsStore.get(this.uid)
      if (exists) {
        for (let key of ['uids', ...keys]) {
          await tx.objectStore(key).delete(this.uid)
        }
      }
      await tx.done
      console.log('clean current database')
    },
    async cleanAllDatabase () {
      let keys = Object.keys(this.store)
      let db = this.db
      let tx = db.transaction(['uids',...keys], 'readwrite')
      let uidsStore = tx.objectStore('uids')
      let uids = await uidsStore.getAllKeys()
      for (let key of Object.keys(this.stores)) {
        for (let uid of uids) {
          await tx.objectStore(key).delete(uid)
        }
      }
      await tx.done
      console.log('clean all database')
    },
    initStore () {
      this.setStoreTree()
      this.setStoreConfigs()
      this.setStoreFilters()
    },
    setStoreFilters (filters) {
      if (filters) {
        this.store.filters = filters
      } else {
        this.store.filters = this.filters
      }
    },
    setStoreConfigs (configs) {
      if (configs) {
        this.store.configs = configs
      } else {
        this.store.configs = this.getConfigs(this.configs)
      }
    },
    setStoreTree (tree) {
      if (tree) {
        this.analyser = new JsonAnalyser({tree})
        this.store.tree = tree
      } else if (this.struct) {
        this.analyser = new JsonAnalyser({tree: this.struct})
        this.store.tree = this.struct
      } else {
        this.store.tree = this.genTree(this.data)
      }
    },
    genTree (data) {
      this.analyser = new JsonAnalyser()
      let {structTree, tree} = this.analyser.analysis(data)
      this.goThrough(tree, _ => {
        if (_.type==='object'||_.type==='array') {
          this.$set(_,'status',{
            open:false,
            projection:false,
            noNewline: false,
            noFirstNewline: false,
          })
        } else {
          this.$set(_,'status',{
            open:false,
            projection:false,
            noNewline: false,
          })
        }
      })
      tree.children.forEach(_ => {
        this.addProjection(_)
      })
      tree.status.open = true
      return tree
    },
    // keyboard
    keydown (event) {
      console.log(event)
      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          event.stopPropagation()
          this.status.sidebarShow=!this.status.sidebarShow
          if (this.status.sidebarShow) {
            this.focusOnSicebar(this.store.status.sidebar)
          } else {
            this.$el.focus()
          }
          break
        case 'PageUp':
          event.preventDefault()
          event.stopPropagation()
          this.switchPage(-1)
          break
        case 'PageDown':
          event.preventDefault()
          event.stopPropagation()
          this.switchPage(1)
          break
        case 'Tab':
          event.preventDefault()
          event.stopPropagation()
          if (event.shiftKey) {
            this.switchTab(-1)
          } else {
            this.switchTab(1)
          }
          break
      }
    },
    switchTab (value) {
      let tabs = ['tree', 'projection', 'extra']
      let cIndex = tabs.findIndex(_ => _===this.store.status.sidebar)
      let nIndex = (cIndex + tabs.length + value) % tabs.length
      this.store.status.sidebar = tabs[nIndex]
      this.updateDatabase(['status'])
    },
    switchPage (value) {
      console.log(this.status)
      let {page, maxPage} = this.status.page
      page = page + value
      if (page<=0) {
        page = 0
      } else if (page >= maxPage - 1) {
        page = maxPage - 1
      }
      if (this.store.status.page !== page) {
        this.onPageChange(page)
        this.store.status.page = page
        this.updateDatabase(['status'])
      }
    },
    // about show
    focusOnSicebar (value) {
      let el
      if (value==='tree') {
        el = this.$refs.tree&&this.$refs.tree.$el
      } else if (value==='projection') {
        el = this.$refs.projection&&this.$refs.projection.$el
      } else if (value==='extra') {
        el = this.$refs.extra
      }
      if (el) {
        setTimeout(() => {
          el.focus()
        },0)
      }
    },
    addProjection (tree, extra) {
      tree.status.projection = true
      let toAdd = {
        name: tree.name,
        path: tree.path, // uid for extraFields
        type: tree.type,
        arrayType: tree.arrayType,
        extra,
        status: {
          show: true,
          noNewline: tree.status&&tree.status.noNewline,
          noFirstNewline: tree.status&&tree.status.noFirstNewline,
        },
      }
      this.store.projectionFields.push(toAdd)
    },
    removeProjection (obj) {
      let index = this.store.projectionFields.findIndex(_ => _===obj)
      let tree
      if (obj.extra) {
        tree = this.extraFields.find(_ => _.path === obj.path)
      } else {
        tree = this.$refs.tree.nodes[obj.path].tree
      }
      tree.status.projection = false
      this.store.projectionFields.splice(index, 1)
    },
    updateProjectionStatus (obj) {
      //let tree = this.$refs.tree.nodes[obj.path].tree
      //let status = obj.status
      //tree.updateNewline(status)
      let project = this.store.projectionFields.find(_ => _.path===obj.path)
      let noFirstNewline = obj.status.noFirstNewline
      let noNewline = obj.status.noNewline
      project.status.noFirstNewline = noFirstNewline
      project.status.noNewline = noNewline
      this.onProjectionChange(this.store.projectionFields, this.store.projectionFields)
    },
    // others
    onTreeUpdate (change, value, origin) {
      if (change&&change.storeUpdate) {
        this.updateDatabase(change.storeUpdate)
      } else if (change&&change.status&&change.status.projection!==undefined) {
        if (change.status.projection) {
          this.addProjection(origin.tree)
        } else {
          let obj = this.store.projectionFields.find(_ => _.path===origin.tree.path && !_.extra)
          if (obj) {
            this.removeProjection(obj)
          }
        }
        this.updateDatabase(['tree', 'projectionFields'])
      } else if (change&&change.status&&change.status.newline) { // update newline
        this.updateDatabase(['tree'])
        if (value.status.projection) { // update projection here
          this.updateProjectionStatus(origin.tree)
        }
      } else { // update selected
        this.updateDatabase(['tree', 'treeState'])
      }
      if (change&&change.changeSelect) {
        clearTimeout(this.timers.treeComments)
        let selected = this.store.treeState.selected
        selected = this.actree.nodes[selected]
        this.store.treeState.comments = {y:selected.$el.getBoundingClientRect().y, comments: selected.comments}
        this.timers.treeComments = setTimeout(() => {
          this.store.treeState.comments = null
        }, 1000)
      }
    },
    goThrough(root, func) {
      func(root)
      if (root.children) {
        for (let child of root.children) {
          this.goThrough(child, func)
        }
      }
    },
    clickChangeSidebar (event) {
      let target = event.target
      this.store.status.sidebar = target.getAttribute('name')
      this.updateDatabase(['status'])
    },
    statusBarInfo (text, type, timeout) {
      if (!timeout) timeout = 3000
      if (type) this.message.type = type
      this.message.text = text
      clearTimeout(this.timers.message)
      this.message.show = true
      this.timers.message = setTimeout(() => {
        this.message.show = false
      }, timeout)
    },
    //resizer
    mousedown (event) {
      if (event.target === this.$refs.resizer) {
        this.status.resizing = true
      }
    },
    mouseup (event) {
      if (this.status.resizing) this.status.resizing = false
    },
    mousemove (event) {
      if (this.status.resizing) {
        event.preventDefault()
        let mouseX = event.x
        let sidebar = this.$refs['sidebar-wrapper']
        let sidebarX = sidebar.getBoundingClientRect().x
        let calWidth = mouseX - sidebarX
        sidebar.style.setProperty('width', calWidth+'px')
      }
    },
    doubleclick (event) {
      if (event.target === this.$refs.resizer) {
        let sidebar = this.$refs['sidebar-wrapper']
        sidebar.style.removeProperty('width')
      }
    },
    // about filter and projection
    onConfigChange (newValue, oldValue) {
      this.onFilterChange(this.store.filters)
    },
    onDataChange (newValue, oldValue) {
      this.onFilterChange(this.store.filters)
    },
    onFilterChange (newValue, oldValue, init) {
      let filteredData = this.data
      this.filteredData = filteredData
      if (!init) {
        this.store.status.page = 0
        this.updateDatabase(['status'])
      }
      this.onProjectionChange(this.store.projectionFields)
    },
    onProjectionChange (newProjects, oldProjects) {
      console.log({newProjects, oldProjects})
      // can optimize here
      if (!oldProjects||newProjects.length!==oldProjects.length) {
        this.projectedData = {}
        for (let projection of this.store.projectionFields) {
          if (!projection.extra) { // normal fields
            this.projectedData[projection.path] = this.analyser.getValueByPath(this.filteredData, projection.path)
          } else { // extra fields
            this.projectedData[projection.path] = this.data.map(_ => projection.calculate(_))
          }
        }
      }
      // projectionStrings
      if (this.store.projectionFields.length===0) { // no fields
        this.projectedStrings = []
      } else {
        let result = this.prettyPrint(this.filteredData, this.store.projectionFields, this.tree)
        this.projectedStrings = result
      }
      this.onPageChange(this.store.status.page)
    },
    onPageChange (newValue, oldValue) {
      let pageSize = this.store.configs.page.pageSize
      let length = this.projectedStrings.length
      let maxPage = Math.ceil(length / pageSize)
      let start = pageSize*newValue
      let end = pageSize*(newValue+1)
      this.pageStrings = this.projectedStrings.slice(start, end)
      this.status.page = {
        maxPage, length, start, end, page: newValue
      }
    },
    _prettyPrint (data, tree, level) {
      let type = this.analyser.getType(data)
      let prefix0 = [...Array(2*level).keys()].map(_ => ' ').join('')
      let prefix1 = [...Array(2*(level+1)).keys()].map(_ => ' ').join('')
      let term, thistree, thisdata
      if (!(tree)) {
        return String(data)+',\n'+prefix0
      }
      if (tree.type==='mixed') {
        tree = tree.children.find(_ => _.type === type)
      }
      if (!(tree)) {
        return String(data)+',\n'+prefix0
      }
      if (type === 'object') {
        let keys = Object.keys(data)
        if (!tree.status.noFirstNewline) {
          term = ['{\n'+prefix1]
        } else {
          term = ['{ ']
        }
        for (let key of keys) {
          thistree = tree.children.find(_ => _.name === key)
          let thisresult
          if (!thistree) {
            thisresult = String(data)
          } else {
            name = thistree.name
            thisdata = data[name]
            thisresult = this._prettyPrint(thisdata, thistree, level+1)
          }
          term.push(`${name}: ${thisresult}`)
        }
        if (term.length)  term[term.length-1] = term[term.length-1].slice(0,-2)
        term.push('},\n'+prefix0)
        term = term.join('')
        return term
      } else if (type === 'array') {
        if (!tree.status.noFirstNewline) {
          term = ['[\n'+prefix1]
        } else {
          term = ['[ ']
        }
        for (let eachdata of data) {
          let thisresult
          if (tree.children) {
            thisresult = this._prettyPrint(eachdata, tree.children[0], level+1)
          } else {
            thisresult = this._prettyPrint(eachdata, tree, level+1)
          }
          term.push(thisresult)
        }
        if (term.length !== 1) {
          term[term.length-1] = term[term.length-1].slice(0,-2)
        } else { // array is empty, use oneline "[]"
          term = ['[']
        }
        if (!tree.status.noNewline) {
          term.push('],\n'+prefix0)
        } else {
          term.push('], ')
        }
        term = term.join('')
        return term
      } else {
        let result
        if (tree.formatter) {
          result = tree.formatter(data)
        } else {
          result = String(data)
        }
        if (!tree.status.noNewline) {
          return `${result},\n${prefix0}`
        } else {
          return `${result}, `
        }
      }
    },
    prettyPrint (data, projectionFields) {
      let plen = this.store.projectionFields.length
      let term
      let projection
      let result = []
      for (let eachdata of data) {
        if (!this.store.tree.status.noFirstNewline) {
          term = ['{\n  ']
        } else {
          term = ['{ ']
        }
        for (let index=0; index<plen; index++) {
          projection = this.store.projectionFields[index]
          let thisresult
          if (!projection.extra) { // normal fields
              let thistree = this.analyser.getTypeByPath(projection.path)
              let thisdata = this.analyser.getValueByPath(eachdata, projection.path)
              thisresult = this._prettyPrint(thisdata, thistree, 1)
          } else { // extra fields
            if (projection.formatter) {
              thisresult = projection.formatter(projection.calculate(eachdata))
            } else {
              thisresult = projection.calculate(eachdata)
            }
          }
          term.push(`${projection.path}: ${thisresult}`)
        }
        if (term.length) term[term.length-1] = term[term.length-1].slice(0,-2)
        term.push('},\n')
        term = term.join('')
        result.push(term)
      }
      return result
    },
  }
}
</script>

<style lang="scss">
$pre: ac-table;
$fontFamily: "'Courier New', Courier, monospace";
.#{$pre} {
  font-family: #{$fontFamily};
  font-size: small;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 20em;
  //max-height: 90vh;
  max-height: 1000px;
  outline:none;
}
.#{$pre}-toolbar {
  padding: 0 0.5rem;
}
.#{$pre}-masker {
  position: absolute;
  width: 100%;
  height: 100%;
}
.#{$pre}-header {
  height: 2em;
  background: #ffeb3c;
  display: flex;
  //justify-content: center;
  align-items: center;
}
.#{$pre}-main {
  display: flex;
  flex: 1;
  max-height: inherit;
}
.#{$pre}-loading {
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
}
.#{$pre}-tree-comments {
  position: fixed;
  padding: 0;
  margin: 0;
}
.#{$pre}-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: max-content;
}
.#{$pre}-sidebar-wrapper {
  display: flex;
  flex-direction: column;
  overflow: overlay;
  position: relative;
  flex-shrink: 0;
}
//::-webkit-scrollbar {
//  display: none;
//}
.#{$pre}-resizer {
  cursor: ew-resize;
  display: flex;
}
.#{$pre}-resizer-selected {
  background: gray;
}
.#{$pre}-sidebar-tab {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #d8ffd775;
  .#{$pre}-sidebar-tab-selected {
    background: white;
  }
}
.#{$pre}-sidebar-tab span{
  flex: 1;
  text-align: center;
}
.#{$pre}-sidebar-tab span:hover{
  background: #d8ffd7;
}
.#{$pre}-content {
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: overlay;
  flex: 1;
  pre {
    margin: 0;
    padding: 0;
  }
}
.#{$pre}-content-index-number {
  height: 100%;
  z-index: -1;
}
.#{$pre}-print-line {
  display: flex;
}
.#{$pre}-print-index {
  background: #fefd9457;
  text-align: right;
}
.#{$pre}-print-data {
}
.#{$pre}-footer {
  height: 2em;
  background: #ffeb3c;
  align-items: center;
  display: flex;
}

.#{$pre}-footer span {
  padding: 0px 0.5em;
}
.#{$pre}-status-message {
  position: absolute;
  right:  0;
}

.ac-unselectable {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
