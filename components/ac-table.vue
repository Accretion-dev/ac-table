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
        :style="{background: status.showSidebar?'#d8ffd7':'unset'}"
        @click="status.showSidebar=!status.showSidebar"
      >
        <icons name="list" size="1rem" />
      </span>
      <div :class="`${prefixCls}-sidebar-tab`" @click="clickChangeSidebar">
        <span name="tree" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='tree'}">
          <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">T</span>
        </span>
        <span name="projection" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='projection'}">
          <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">P</span>
        </span>
        <span name="extraField" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='extraField'}">
          <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">E</span>
        </span>
      </div>
      <span @click="cleanCurrentDatabase">
        cleanCuurent
      </span>
      <span @click="cleanAllDatabase">
        cleanAll
      </span>
      <span ref="pageStatus" style="position:absolute; right:0; display:flex; align-items:center;">
        <ac-input
          v-model="page"
          type="number"
          :focus-select-all-text="true"
          placeholder="page"
          :validator="validators.number"
          :reportDelay="200"
        />
        <span>({{status.page.start}}~{{status.page.end}})</span>{{"/"}}<span>{{status.page.maxPage}}({{status.page.length}})</span>
        <span @click="status.showSettings = !status.showSettings;">
          <icons name="settings" size="1rem" />
        </span>
      </span>
    </div>
    <div style="position: relative;" v-if="status.showSettings">
      <div :class="`${prefixCls}-settings`" >
        <div v-for="key of Object.keys(store.configs)" :key="key">
          <span>{{key}}:</span>
          <div
            v-for="subkey of Object.keys(store.configs[key])"
            :key="subkey"
            style="padding-left: 1rem; display:flex; align-items: center;"
          >
            <span>{{subkey}}:</span>
            <template v-if="defaultConfigs[key][subkey].type==='boolean'">
              <input type="checkbox" v-model="store.configs[key][subkey]" />
            </template>
            <template v-else>
              <ac-input
                v-model="store.configs[key][subkey]"
                :type="defaultConfigs[key][subkey].type"
                :focus-select-all-text="true"
                :placeholder="defaultConfigs[key][subkey].type"
                :validator="validators[defaultConfigs[key][subkey].type]"
                :reportDelay="200"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
    <div :class="`${prefixCls}-main`">
      <template v-if="loading">
        <div :class="`${prefixCls}-loading`">
          loading...
        </div>
      </template>
      <template v-else>
        <div v-show="status.showSidebar" ref="sidebar-wrapper" :class="`${prefixCls}-sidebar-wrapper`">
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
              :projections="store.projection"
              :projectionState="store.projectionState"
              @update="onProjectionUpdate"
            />
            <ac-tree-extra-field
              v-show="store.status.sidebar==='extraField'"
              ref="extraField"
              :extra-field="store.extraField"
              :extra-field-state="store.extraFieldState"
              @update="onExtraFieldUpdate"
            />
          </div>
        </div>
        <div v-show="status.showSidebar"
             ref="resizer"
             :class="{[`${prefixCls}-resizer`]: true, [`${prefixCls}-resizer-selected`]:status.resizing}"
             :style="{'z-index': masker?999:'unset'}"
        >
          <span style="width:1px; background:gray; margin-right:2px;pointer-events: none;" />
        </div>
        <div :class="`${prefixCls}-content`">
          <div v-for="(pdata,index) in pageStrings" :key="index" :class="`${prefixCls}-print-line`">
            <span
              :class="`${prefixCls}-print-index`"
              :style="{width:`${digital}rem`,'flex-shrink':0}"
            >{{ index+status.page.start }}</span>
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
import acTreeExtraField from './ac-tree-extra-field'
import icons from '../icons/icons.vue'

/* TODO:
* extra field system
* filter system
* sort system
* table system
* demo
*/

export default {
  name: 'ac-table',
  components: {acTree, acTreeProjection, acTreeExtraField, icons},
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
      sortedData: [],
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
        projection:[],
        projectionState: {
          selected: null,
        },
        extraField: [],
        extraFieldState: {
          selected: null,
        },
        configs: {},
        filters: {},
        status: {
          sidebar: 'tree',
          page: 0,
          tablePage: 0,
        },
      },
      status: {
        showSidebar: true,
        showSettings: false,
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
        treeComments: null,
        onProjectionChange: null,
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
          debounceDelay: { type: 'number', default: 500, },
        },
        page: {
          pageSize: { type: 'positive', default: 10 },
          tablePageSize: { type: 'positive', default: 100 },
        }
      },
      validators: {
        boolean: value => {
          if (value !== 'true' && value !== 'false') {
            return 'should be true or false'
          }
        },
        number: value => {
          if (!(value&&!isNaN(Number(value)))) {
            return 'should be a number'
          }
        },
        positive: value => {
          if (!(value&&!isNaN(Number(value))&&Number(value)>0)) {
            return 'should be a positive number'
          }
        },
      }
    }
  },
  computed: {
    digital () {
      let N = this.data.length
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
    page: {
      get () {
        return this.status.page.page
      },
      set (value) {
        this.switchPage(value, true)
      }
    }
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
    * when store.tree, store.projection, store.filters change(inside)
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
      this.store.configs = newValue
    }
    this.$watch('data', dataChange)
    this.$watch('struct',  structChange)
    this.$watch('filters', filtersChange)
    this.$watch('configs', configsChange, {deep: true})
    this.$watch('store.configs', this.onConfigChange, {deep: true})

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
        this.db = db
        let tx = db.transaction(['uids', ...keys], 'readwrite')
        let uidsStore = tx.objectStore('uids')
        let data, uid
        uid = await uidsStore.get(this.uid)
        if (!uid) { // init the store
          // tree, treeState, extraFields, projection, configs, status
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
        this.loading = false
        this.store.treeState.comments = null
      }
    },
    updateDatabase (fields, sync) {
      let keys = Object.keys(this.store)
      let all = ['uids', ...keys]
      if (!fields) fields = all
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
      for (let key of keys) {
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
    setStoreExtraFields (value) {
      if (value) {
        this.store.extraField = value
      } else {
        this.store.extraField = this.extraField
      }
    },
    setStoreProjections (value) {
      if (value) {
        this.store.projection = value
      } else {
        this.store.projection = this.projection
      }
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
            noProNewline: false,
            noProFirstNewline: false,
          })
        } else {
          this.$set(_,'status',{
            open:false,
            projection:false,
            noNewline: false,
            noProNewline: false,
            noProFirstNewline: false,
          })
        }
      })
      this.addProjection(tree.children[0])
      tree.status.open = true
      return tree
    },
    // keyboard
    keydown (event) {
      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          event.stopPropagation()
          this.status.showSidebar=!this.status.showSidebar
          if (this.status.showSidebar) {
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
      let tabs = ['tree', 'projection', 'extraField']
      let cIndex = tabs.findIndex(_ => _===this.store.status.sidebar)
      let nIndex = (cIndex + tabs.length + value) % tabs.length
      this.store.status.sidebar = tabs[nIndex]
      this.updateDatabase(['status'])
    },
    switchPage (value, set) {
      let {page, maxPage} = this.status.page
      if (set) {
        page = value
      } else {
        page = page + value
      }
      if (page<=0) {
        page = 0
      } else if (page >= maxPage) {
        page = maxPage
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
      } else if (value==='extraField') {
        el = this.$refs.extraField&&this.$refs.extraField.$el
      }
      if (el) {
        setTimeout(() => {
          el.focus()
        },0)
      }
    },
    addProjection (tree) {
      let exists = this.store.projection.find(_ => _.path===tree.path && _.extraField===tree.extraField)
      tree.status.projection = true
      if (exists) return
      let toAdd = {
        name: tree.name,
        path: tree.path, // uid for extraFields
        type: tree.type,
        arrayType: tree.arrayType,
        extraField: tree.extraField,
        js: tree.js,
        status: {
          show: true,
          noNewline: tree.status&&tree.status.noNewline,
          noFirstNewline: tree.status&&tree.status.noFirstNewline,
          noProNewline: tree.status&&tree.status.noProNewline,
          noProFirstNewline: tree.status&&tree.status.noProFirstNewline,
        },
      }
      this.store.projection.push(toAdd)
    },
    removeProjection (obj) {
      let index = this.store.projection.findIndex(_ => _===obj)
      let tree
      if (obj.extraField) {
        tree = this.store.extraField.find(_ => _.path === obj.path)
      } else {
        tree = this.$refs.tree.nodes[obj.path].tree
      }
      tree.status.projection = false
      this.store.projection.splice(index, 1)
    },
    updateProjectionStatus (obj) {
      //let tree = this.$refs.tree.nodes[obj.path].tree
      //let status = obj.status
      //tree.updateNewline(status)
      let project = this.store.projection.find(_ => _.path===obj.path&&!!_.extraField===!!obj.extraField)
      console.log('update projection:', obj, project)
      if (project) {
        let noFirstNewline = obj.status.noFirstNewline
        let noNewline = obj.status.noNewline
        let noProFirstNewline = obj.status.noProFirstNewline
        let noProNewline = obj.status.noProNewline
        project.status.noFirstNewline = noFirstNewline
        project.status.noNewline = noNewline
        project.status.noProFirstNewline = noProFirstNewline
        project.status.noProNewline = noProNewline
        project.name = obj.name
        project.type = obj.type
        project.arrayType = obj.arrayType
      }
      // should be outside, in case you change newline of nested structure
      clearTimeout(this.timers.onProjectionChange)
      this.timers.onProjectionChange = setTimeout(() => {
        this.onProjectionChange(this.store.projection, this.store.projection)
      }, this.store.configs.projection.debounceDelay)
      this.updateDatabase(['projection'])
    },
    // others
    onTreeUpdate (change, value, origin) {
      if (change&&change.storeUpdate) {
        this.updateDatabase(change.storeUpdate)
      } else if (change&&change.status&&change.status.projection!==undefined) {
        if (change.status.only) {
          for (let each of this.store.projection) {
            if (!each.extraField) {
              let path = each.path
              let node = this.$refs.tree.nodes[path]
              if (node) {
                node.tree.status.projection = false
              }
            }
          }
          this.store.projection = []
          this.addProjection(origin.tree)
        } else if (change.status.projection) {
          this.addProjection(origin.tree)
        } else {
          let obj = this.store.projection.find(_ => _.path===origin.tree.path && !_.extraField)
          if (obj) {
            this.removeProjection(obj)
          }
        }
        this.updateDatabase(['tree'])
        this.updateProjectionStatus(origin.tree)
      } else if (change&&change.status&&change.status.newline) { // update newline
        this.updateDatabase(['tree'])
        this.updateProjectionStatus(origin.tree)
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
        }, this.store.configs.projection.debounceDelay)
      }
    },
    onProjectionUpdate (change) {
      this.updateDatabase(['projectionState'])
      if (change.changeShow||change.reorder) {
        this.updateDatabase(['projection'])
        clearTimeout(this.timers.onProjectionChange)
        this.timers.onProjectionChange = setTimeout(() => {
          this.onProjectionChange(this.store.projection, this.store.projection)
        }, 500)
      }
      if (change.deleteProjection) {
        this.removeProjection(change.deleteProjection)
        this.updateDatabase(['tree', 'projection'])
        clearTimeout(this.timers.onProjectionChange)
        this.timers.onProjectionChange = setTimeout(() => {
          this.onProjectionChange(this.store.projection, this.store.projection)
        }, 500)
      }
    },
    genExtraFunction (js, value) {
      let lines = js.split('\n')
      let funcStr = []
      for (let line of lines) {
        let commands = line.split(';')
        for (let command of commands) {
          funcStr.push(command)
        }
      }
      if (!funcStr[funcStr.length-1].includes('return ')) {
        let str = funcStr[funcStr.length-1]
        funcStr[funcStr.length-1] = `return ${str}`
      }
      let str = funcStr.join('\n')
      let func = new Function('v,e', str)
      return func
    },
    onExtraFieldUpdate (change, origin) {
      console.log('opExtraFieldUpdate', change)
      if (change.add) {
        this.store.extraField.push(change.add)
        this.updateDatabase(['extraField'])
      }
      if (change.modify) {
        this.updateDatabase(['extraField'])
        this.updateProjectionStatus(change.modify)
      }
      if (change.changeShow||change.reorder) {
        this.updateDatabase(['extraField'])
      }
      if (change.deleted) {
        this.removeProjection(change.deleted)
        let index = this.store.extraField.findIndex(_ => _===change.deleted)
        if (index !== -1) {
          this.store.extraField.splice(index, 1)
        }
        this.updateDatabase(['extraField'])
        this.updateDatabase(['extraFieldState'])
      }
      if (change.status&&change.status.newline) {
        this.updateDatabase(['extraField'])
        this.updateProjectionStatus(origin.data)
      }
      if (change.status&&change.status.projection!==undefined) {
        if (change.status.only) {
          for (let each of this.store.projection) {
            if (each.extraField) {
              let path = each.path
              let node = this.$refs.extraField.nodes[path]
              if (node) {
                node.data.status.projection = false
              }
            }
          }
          this.store.projection = []
          this.addProjection(origin.data)
        } else if (change.status.projection) {
          this.addProjection(origin.data)
        } else {
          let obj = this.store.projection.find(_ => _.path===origin.tree.path && _.extraField)
          if (obj) {
            this.removeProjection(obj)
          }
        }
        this.updateDatabase(['tree'])
        this.updateProjectionStatus(origin.data)
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
      this.updateDatabase(['configs'])
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
      this.onSortChange()
    },
    onSortChange () {
      this.sortedData = this.filteredData
      this.onProjectionChange(this.store.projection)
    },
    onProjectionChange (newProjects, oldProjects) {
      console.log({newProjects, oldProjects})
      // can optimize here
      if (!oldProjects||newProjects.length!==oldProjects.length) {
        this.projectedData = {}
        for (let projection of this.store.projection) {
          if (!projection.extraField) { // normal fields
            this.projectedData[projection.path] = this.analyser.getValueByPath(this.sortedData, projection.path)
          } else { // extra fields
            if (projection.func) {
              this.projectedData[projection.path] = this.data.map(_ => projection.func(_))
            } else {
              this.projectedData[projection.path] = this.data.map(_ => undefined)
            }
          }
        }
      }
      // projectionStrings
      if (this.store.projection.length===0) { // no fields
        this.projectedStrings = []
      } else {
        let result = this.prettyPrint(this.sortedData, this.store.projection, this.store.tree, this.store.configs)
        this.projectedStrings = result
      }
      this.onPageChange(this.store.status.page)
    },
    onPageChange (newValue, oldValue) {
      let pageSize = this.store.configs.page.pageSize
      let length = this.projectedStrings.length
      let maxPage = Math.floor(length / pageSize)
      let start = pageSize*newValue
      let end = pageSize*(newValue+1)-1
      end = end>=length-1?length-1:end
      this.pageStrings = this.projectedStrings.slice(start, end+1)
      this.status.page = {
        maxPage, length, start, end, page: newValue
      }
    },
    _prettyPrint (data, tree, level, configs) {
      let type = this.analyser.getType(data)
      let prefix0 = [...Array(2*level).keys()].map(_ => ' ').join('')
      let prefix1 = [...Array(2*(level+1)).keys()].map(_ => ' ').join('')
      let term, thistree, thisdata
      if (!(tree)) {
        return JSON.stringify(data)+',\n'+prefix0
      }
      if (tree.type==='mixed') {
        tree = tree.children.find(_ => _.type === type)
      }
      if (data===undefined) {
        if (this.store.configs.projection.showUndefined) {
          if (tree&&tree.status&&tree.status.noNewline) {
            return `${data}, `
          } else {
            return `${data},\n${prefix0}`
          }
        } else {
          return undefined
        }
      }
      if (!(tree)) {
        return JSON.stringify(data)+',\n'+prefix0
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
            thisresult = JSON.stringify(data)
          } else {
            name = thistree.name
            thisdata = data[name]
            thisresult = this._prettyPrint(thisdata, thistree, level+1, configs)
          }
          if (configs.projection.showUndefined || thisresult !== undefined) {
            term.push(`${name}: ${thisresult}`)
          }
        }
        if (term.length)  term[term.length-1] = term[term.length-1].slice(0,-2)
        term.push('},\n'+prefix0)
        term = term.join('')
        return term
      } else if (type === 'array') {
        if (!tree.status.noFirstNewline) {
          term = ['[\n'+prefix1]
        } else {
          term = ['[']
        }
        for (let eachdata of data) {
          let thisresult
          if (tree.children) {
            thisresult = this._prettyPrint(eachdata, tree.children[0], level+1, configs)
          } else {
            thisresult = this._prettyPrint(eachdata, tree, level+1, configs)
          }
          if (this.store.configs.projection.showUndefined || thisresult !== undefined) {
            term.push(thisresult)
          }
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
          result = JSON.stringify(data)
        }
        if (this.store.configs.projection.showUndefined || result !== undefined) {
          if (!tree.status.noNewline) {
            return `${result},\n${prefix0}`
          } else {
            return `${result}, `
          }
        } else {
          return undefined
        }
      }
    },
    prettyPrint (data, projections, tree, configs) {
      let plen = projections.length
      let term
      let result = []
      let projection
      let extraFieldFunctions = new Map()
      for (let eachdata of data) {
        if (!tree.status.noFirstNewline) {
          term = ['{\n  ']
        } else {
          term = ['{ ']
        }
        for (let index=0; index<plen; index++) {
          projection = projections[index]
          if (!projection.status.show) continue
          let thisresult
          let showName
          let thattree
          if (!projection.extraField) { // normal fields
            let thistree = this.analyser.getTypeByPath(projection.path)
            let thisdata = this.analyser.getValueByPath(eachdata, projection.path)
            if (projection.path.includes('>')) {
              thattree = {
                name: thistree.name,
                path: thistree.path,
                type: 'array',
                children: [thistree],
                status: {
                  noFirstNewline: thistree.status.noProFirstNewline,
                  noNewline: thistree.status.noProNewline,
                }
              }
            } else {
              thattree = thistree
            }
            thisresult = this._prettyPrint(thisdata, thattree, 1, configs)
            showName = projection.path
          } else { // extra fields
            if (projection.js) {
              let func = extraFieldFunctions.get(projection.js)
              if (!func) {
                func = this.genExtraFunction(projection.js)
                extraFieldFunctions.set(projection.js, func)
              }

              let extractor = (path) => this.analyser.getValueByPath(eachdata, path)
              thisresult = func(eachdata, extractor)

              if (thisresult!==undefined) {
                let type = this.analyser.getType(thisresult)
                if (type === 'array' || type === 'object') {
                  if (projection.status.noFirstNewline) {
                    thisresult = JSON.stringify(thisresult)
                    if (projection.status.noNewline) {
                      thisresult = `${thisresult}, `
                    } else {
                      thisresult = `${thisresult},\n  `
                    }
                  } else {
                    thisresult = JSON.stringify(thisresult,null,2)
                    let lines = thisresult.split('\n')
                    let newlines = lines.map((_,index) => '  '+_)
                    newlines[0] = newlines[0].slice(2)
                    if (projection.status.noNewline) {
                      newlines[newlines.length-1] = newlines[newlines.length-1]+', '
                    } else {
                      newlines[newlines.length-1] = newlines[newlines.length-1]+',\n  '
                    }
                    thisresult = newlines.join('\n')
                  }
                } else {
                  if (projection.status.noNewline) {
                    thisresult = `${JSON.stringify(thisresult)}, `
                  } else {
                    thisresult = `${JSON.stringify(thisresult)},\n  `
                  }
                }
              }
            } else {
              thisresult = undefined
            }
            showName = projection.name
          }
          if (configs.projection.showUndefined || thisresult !== undefined) {
            let toPush = `${showName}: ${thisresult}`
            if (thisresult===undefined) {
              toPush = toPush + ',\n  '
            }
            term.push(toPush)
          }
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
.#{$pre}-settings {
  position: absolute;
  right: 0;
  padding-right: 1rem;
  background: #d8ffd7;
  z-index: 99;
}
.#{$pre}-toolbar {
  padding: 0 0.5rem;
  align-items: center;
  display: flex;
}
.#{$pre}-masker {
  position: absolute;
  width: 100%;
  height: 100%;
}
.#{$pre}-header {
  height: 2em;
  background: #fff8b7;
  display: flex;
  //justify-content: center;
  align-items: stretch;
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
  background: #d8ffd7;
  z-index: 99;
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
