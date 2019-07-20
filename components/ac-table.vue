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
    <div :class="`${prefixCls}-treeState-comments`">
      <pre
        v-show="store.treeState.comments&&!loading"
        ref="tree-comments"
        :class="`${prefixCls}-tree-comments`"
      >{{ store.treeState.comments?store.treeState.comments.comments:"" }}</pre>
      <pre
        v-show="store.tableTreeState.comments&&!loading"
        ref="table-tree-comments"
        :class="`${prefixCls}-tree-comments`"
      >{{ store.tableTreeState.comments?store.tableTreeState.comments.comments:"" }}</pre>
      <div :class="`${prefixCls}-masker`" :style="{'z-index': masker?100:-1}" />
    </div>
    <div :class="`${prefixCls}-header`">
      <span
        :class="`${prefixCls}-show-toolbar`"
        @click="status.showSidebar=!status.showSidebar"
      >
        <icons v-if="!status.showSidebar" name="double-angle-pointing-to-right" size="1rem" />
        <icons v-if="status.showSidebar" name="double-left-chevron" size="1rem" />
      </span>
      <div :class="`${prefixCls}-sidebar-tab`" @click="clickChangeSidebar($event, 'mode')">
        <span name="list" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.mode==='list'}">
          <icons class="ac-unselectable" style="pointer-events:none;padding: 0 0.5rem;" name="numbered-list" size="1rem" />
        </span>
        <span name="table" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.mode==='table'}">
          <icons class="ac-unselectable" style="pointer-events:none;padding: 0 0.5rem;" name="table-grid" size="1rem" />
        </span>
        <span name="fold" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.mode==='fold'}">
          <icons class="ac-unselectable" style="pointer-events:none;padding: 0 0.5rem;" name="tree-json" size="1rem" />
        </span>
      </div>
      <div :class="`${prefixCls}-sidebar-tab`" style="border: solid; border-width: thin;" @click="clickChangeSidebar($event, 'sidebar')">
        <span name="filter" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='filter'}">
          <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">F</span>
        </span>
        <span name="extraField" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='extraField'}">
          <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">E</span>
        </span>
        <icons class="ac-unselectable" style="pointer-events:none;padding: 0 0 0 0.5rem;" name="numbered-list" size="1rem" />
        :
        <span name="struct" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='struct'}">
          <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">S</span>
        </span>
        <span name="projection" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='projection'}">
          <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">P</span>
        </span>
        <icons class="ac-unselectable" style="pointer-events:none;padding: 0 0 0 0.5rem;" name="table-grid" size="1rem" />
        :
        <span name="table-struct" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='table-struct'}">
          <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">S</span>
        </span>
        <span name="table-projection" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='table-projection'}">
          <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">P</span>
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
        <div v-for="key of Object.keys(store.config)" :key="key">
          <span>{{key}}:</span>
          <div
            v-for="subkey of Object.keys(store.config[key])"
            :key="subkey"
            style="padding-left: 1rem; display:flex; align-items: center;"
          >
            <span>{{subkey}}:</span>
            <template v-if="defaultConfigs[key][subkey].type==='boolean'">
              <input type="checkbox" v-model="store.config[key][subkey]" />
            </template>
            <template v-else>
              <ac-input
                v-model="store.config[key][subkey]"
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
            <ac-struct
              v-show="store.status.sidebar==='struct'"
              ref="struct"
              :tree="store.tree"
              :tree-state="store.treeState"
              @update="onTreeUpdate"
            />
            <ac-table-projection
              v-show="store.status.sidebar==='projection'"
              ref="projection"
              :projections="store.projection"
              :projectionState="store.projectionState"
              @update="onProjectionUpdate"
            />
            <ac-struct
              v-show="store.status.sidebar==='table-struct'"
              prefix="table"
              ref="table-struct"
              :tree="store.tableTree"
              :tree-state="store.tableTreeState"
              @update="onTreeUpdate"
            />
            <ac-table-projection
              v-show="store.status.sidebar==='table-projection'"
              prefix="table"
              ref="table-projection"
              :projections="store.tableProjection"
              :projectionState="store.tableProjectionState"
              @update="onProjectionUpdate"
            />
            <ac-table-extra-field
              v-show="store.status.sidebar==='extraField'"
              ref="extraField"
              :extra-field="store.extraField"
              :extra-field-state="store.extraFieldState"
              @update="onExtraFieldUpdate"
            />
            <ac-table-filter
              v-show="store.status.sidebar==='filter'"
              ref="filter"
              :rawdata="data"
              :tree="store.tree"
              :filter="store.filter"
              :filter-state="store.filterState"
              @update="onFilterUpdate"
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
          <div :class="`${prefixCls}-list-content`" v-show="store.status.mode==='list'">
            <div v-for="(pdata,index) in pageStrings" :key="index" :class="`${prefixCls}-print-line`">
              <span
                :class="`${prefixCls}-print-index`"
                :style="{width:`${digital}rem`,'flex-shrink':0}"
              >{{ index+status.page.start }}</span>
              <pre :class="`${prefixCls}-print-data`">{{ pdata }}</pre>
            </div>
          </div>
          <div :class="`${prefixCls}-table-content`" v-show="store.status.mode==='table'">
          </div>
          <div :class="`${prefixCls}-fold-content`" v-show="store.status.mode==='fold'">
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
import acStruct from './ac-struct'
import acTableProjection from './ac-table-projection'
import acTableExtraField from './ac-table-extra-field'
import acTableFilter from './ac-table-filter'
import icons from '../icons/icons.vue'

/* TODO:
* filter system
* sort system
* table system
* demo
*/

/* Data flow:
 * data =>
    filteredData =>
      sortedData =>
        projectedData and projectedStrings =>
          pageStrings
 * function call flow
   onConfigChange or onDataChange =>
     onFilterChange =>
       onSortChange =>
         onProjectionChange =>
           onPageChange
 */

export default {
  name: 'ac-table',
  components: {acStruct, acTableProjection, acTableExtraField, acTableFilter, icons},
  props: {
    data: { type: Array, default () { return [] } },
    config: { type: Object, default: null },
    filter: { type: Object, default: null },
    struct: { type: Object, default: null },
    projection: { type: Object, default: null },
    extraField: { type: Object, default: null },
    tableStruct: { type: Object, default: null },
    tableProjection: { type: Object, default: null },
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
      projectedData: {}, // in rows
      pageData: [],
      projectedStrings: [],
      pageStrings: [],
      store: {
        filter: [],
        filterState: {
          selected: null,
        },
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
        tableTree: {root: true, status:{open:true}},
        tableTreeState: {
          selected: null,
          comments: null,
        },
        tableProjection:[],
        tableProjectionState: {
          selected: null,
        },
        config: {},
        status: {
          mode: 'list',
          sidebar: 'struct',
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
        global: {
          doPrintEachPage: { type: 'boolean', default: false, },
        },
        page: {
          pageSize: { type: 'positive', default: 10 },
          tablePageSize: { type: 'positive', default: 100 },
        },
        projection: {
          showUndefined: { type: 'boolean', default: true, },
          debounceDelay: { type: 'number', default: 500, },
        },
        tableProjection: {
          showUndefined: { type: 'boolean', default: true, },
          debounceDelay: { type: 'number', default: 500, },
        },
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
    'store.tableTreeState.comments' (value) {
      if (!value) return
      let el = this.$refs['table-tree-comments']
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
    this.$watch('store.status.sidebar', this.focusOnSidebar)
    // watch for props change
    let dataChange = (newValue, oldValue) => {
      console.log('data changed!')
    }
    let configChange = (newValue, oldValue) => {
      console.log('config changed!')
      this.store.config = newValue
    }
    let filterChange = (newValue, oldValue) => {
      console.log('filter changed!')
      this.store.filter = newValue
    }

    let structChange = (newValue, oldValue) => {
      console.log('structs changed!')
      this.analyser = new JsonAnalyser({tree: value})
    }
    let projectionChange = (newValue, oldValue) => {
      console.log('projections changed!')
    }
    let extraFieldChange = (newValue, oldValue) => {
      console.log('extraFields changed!')
    }
    let tableStructChange = (newValue, oldValue) => {
      console.log('table structs changed!')
      this.analyser = new JsonAnalyser({tree: value})
    }
    let tableProjectionChange = (newValue, oldValue) => {
      console.log('table projections changed!')
    }

    this.$watch('data', dataChange)
    this.$watch('config', configChange, {deep: true})
    this.$watch('filter', filterChange)

    this.$watch('struct',  structChange)
    this.$watch('projection',  projectionChange)
    this.$watch('extraField',  extraFieldChange)
    this.$watch('tableStruct',  tableStructChange)
    this.$watch('tableProjection',  tableProjectionChange)

    this.$watch('store.config', this.onConfigChange, {deep: true})
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
        this.updateStore({init: true})
      }
    },
    // about database and init
    async saveStore (key, tx) {
      let keys
      if (key) {
        keys = [key]
      } else { // save all
        keys = Object.keys(this.store)
        await tx.objectStore('uids').put(this.uid, this.uid)
      }
      for (let key of keys) {
        await tx.objectStore(key).put(this.store[key], this.uid)
      }
    },
    getConfigs (config) {
      // update config only to level 2 depth
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
      } else { // client support indexedDB
        let keys = Object.keys(this.store) // get all keys from default
        let db = await openDB('ac-table', 1, {
          upgrade (db, oldVersion, newVersion, transaction) {
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
          this.updateStore({init: true, uid})
          await this.saveStore(null, tx)
        } else {
          this.statusBarInfo(`use old store`, 'info')
          data = {}
          for (let key of keys) {
            data[key] = await tx.objectStore(key).get(this.uid)
          }
          this.analyser = new JsonAnalyser({tree: data.tree})
          Object.assign(this.store, data)
          this.updateStore({init: true, uid})
          await this.saveStore(null, tx)
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
        this.store.tableTreeState.comments = null
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
    updateStore ({init, uid}) {
      this.setStore({key: 'config', value: this.config, init: true})
      this.setStore({key: 'filter', value: this.filter, init: true})
      this.setStore({key: 'projection', value: this.projection, init: true})
      this.setStore({key: 'tableProjection', value: this.tableProjection, init: true})
      this.setStore({key: 'extraField', value: this.extraField, init: true})
      this.setStoreTree({init, uid, value: this.struct})
      this.setStoreTableTree({init, uid, value: this.tableStruct})
    },
    genTree (data, init) {
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
      tree.status.open = true
      return tree
    },
    setStoreTree({value, uid, init}) {
      if (init) {
        if (uid) {
          if (value) { // use prop value
            this.analyser = new JsonAnalyser({tree:value})
            this.store.tree = value
          } else { // use old value
          }
        } else { // totally clean database, generate all
          this.store.tree = this.genTree(this.data)
          this.store.tableTree = JSON.parse(JSON.stringify(this.store.tree))
          this.addProjection(this.store.tree.children[0])
          for (let child of this.store.tableTree.children) {
            this.addProjection(child, 'table')
          }
        }
      } else if (value) {
        this.analyser = new JsonAnalyser({tree:value})
        this.store.tree = value
      } else { // struct set to null, recalculate
        this.store.tree = this.genTree(this.data)
      }
    },
    setStoreTableTree({value, uid, init}) {
      if (init) {
        if (uid) {
          if (value) { // use prop value
            this.analyser = new JsonAnalyser({tree:value}) // deplicated
            this.store.tableTree = value
          } else { // use old value
          }
        } else { // totally clean database, generate all
          // done in setStoreTree
        }
      } else if (value) {
        this.analyser = new JsonAnalyser({tree:value})
        this.store.tableTree = value
      } else { // struct set to null, recalculate
        this.store.tableTree = this.genTree(this.data)
      }
    },
    setStore ({key, value, init}) {
      let getValue = (key, value) => {
        if (key === 'config') {
          return this.getConfigs(value)
        } else if (key === 'tree') {
          if (value) {
            this.analyser = new JsonAnalyser({tree:value})
            this.store.tree = value
          } else {
            this.store.tree = this.genTree(this.data)
          }
          return this.store.tree
        } else {
          return value
        }
      }
      if (init) {
        let result = getValue(key, value)
        if (result) {
          this.store[key] = result
        }
      } else if (value) {
        this.store[key] = getValue(key, value) // key change to not-null
      }
      // TODO, update related keys (e.g. update treeState if projection change)
    },
    //=================
    // keyboard
    keydown (event) {
      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          event.stopPropagation()
          this.status.showSidebar=!this.status.showSidebar
          if (this.status.showSidebar) {
            this.focusOnSidebar(this.store.status.sidebar)
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
      let tabs = ['filter', 'extraField', 'struct', 'projection', 'table-struct', 'table-projection']
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
    focusOnSidebar (value) {
      let el
      if (value==='struct') {
        el = this.$refs.struct&&this.$refs.struct.$el
      } else if (value==='projection') {
        el = this.$refs.projection&&this.$refs.projection.$el
      } else if (value==='table-struct') {
        el = this.$refs['table-struct']&&this.$refs['table-struct'].$el
      } else if (value==='table-projection') {
        el = this.$refs['table-projection']&&this.$refs['table-projection'].$el
      } else if (value==='extraField') {
        el = this.$refs.extraField&&this.$refs.extraField.$el
      } else if (value==='filter') {
        el = this.$refs.filter&&this.$refs.filter.$el
      }
      if (el) {
        setTimeout(() => {
          el.focus({ preventScroll: true })
        },0)
      }
    },
    addProjection (tree, prefix) {
      let key = prefix?'tableProjection':'projection'
      let exists = this.store[key].find(_ => _.path===tree.path && _.extraField===tree.extraField)
      if (tree.extraField) {
        if (prefix) {
          tree.status.tableProjection = true
        } else {
          tree.status.projection = true
        }
      } else {
        tree.status.projection = true
      }
      if (exists) {
        if (exists.extraField) {
          tree.status[key] = true
        } else {
          tree.status.projection = true
        }
        return
      }
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
      this.store[key].push(toAdd)
    },
    removeProjection (obj, prefix) {
      let todos
      if (prefix === 'both') {
        todos = ['projection', 'tableProjection']
      } else {
        todos = [prefix?'tableProjection':'projection']
      }
      for (let pkey of todos) {
        let index = this.store[pkey].findIndex(_ => _===obj)
        let tree
        if (obj.extraField) {
          tree = this.store.extraField.find(_ => _.path === obj.path)
        } else {
          let struct = pkey.startsWith('table')?'table-struct':'struct'
          tree = this.$refs[struct].nodes[obj.path].tree
        }
        if (tree) {
          if (obj.extraField) {
            tree.status[pkey] = false
          } else {
            tree.status.projection = false
          }
        }
        this.store[pkey].splice(index, 1)
        let lastProject = this.store[pkey][index]
        let projectionKey = pkey.startsWith('table')?'table-projection':'projection'
        let projectionStateKey = pkey.startsWith('table')?'tableProjectionState':'projectionState'
        if (lastProject) {
          let key = this.$refs[projectionKey].getKey(lastProject)
          this.store[projectionStateKey].selected = key
          this.$refs[projectionKey].setSelected(key, true)
        }
      }
    },
    updateProjectionStatus (obj, prefix) {
      let todos
      if (prefix === 'both') {
        todos = [this.store.projection, this.store.tableProjection]
      } else {
        todos = [this.store[prefix?'tableProjection':'projection']]
      }
      for (let thisprojection of todos) {
        let project = thisprojection.find(_ => _.path===obj.path&&!!_.extraField===!!obj.extraField)
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
          if (project.js !== undefined) project.js = obj.js
        }
      }
      if (prefix === 'both' || !prefix) { // update table
        clearTimeout(this.timers.onProjectionChange)
        this.timers.onProjectionChange = setTimeout(() => {
          this.onProjectionChange(this.store.projection, this.store.projection)
        }, this.store.config.projection.debounceDelay)
        this.updateDatabase(['projection'])
      } else { // update table
        this.updateDatabase(['tableProjection'])

      }
    },
    // others
    cleanProjection (prefix) {
      let todos
      if (prefix === 'both') {
        todos = ['projection', 'tableProjection']
      } else {
        todos = [prefix?'tableProjection':'projection']
      }
      for (let pkey of todos) {
        for (let each of this.store[pkey]) {
          if (!each.extraField) { // clean tree
            let path = each.path
            let struct = pkey.startsWith('table')?'table-struct':'struct'
            let node = this.$refs[struct].nodes[path]
            if (node) {
              node.tree.status.projection = false // not extra field, use projection
            }
          } else { // clean extraField
            let path = each.path
            let node = this.$refs.extraField.nodes[path]
            if (node) {
              node.data.status[pkey] = false // extra field, use pkey
            }
          }
        }
        this.store[pkey] = []
      }
    },
    onTreeUpdate (change, value, origin) {
      if (change&&change.storeUpdate) { // for changeSelect
        this.updateDatabase(change.storeUpdate)
      } else if (change&&change.status&&change.status.projection!==undefined) {
        let prefix = change.prefix
        if (change.status.only) {
          this.cleanProjection(prefix)
          this.addProjection(origin.tree, prefix)
        } else if (change.status.projection) {
          this.addProjection(origin.tree, prefix)
        } else {
          let thisprojection = prefix?this.store.tableProjection:this.store.projection
          let obj = thisprojection.find(_ => _.path===origin.tree.path && !_.extraField)
          if (obj) {
            this.removeProjection(obj, prefix)
          } else {
            origin.tree.status.projection = false
          }
        }
        this.updateDatabase([prefix?'tableTree':'tree'])
        this.updateProjectionStatus(origin.tree, prefix)
      } else if (change&&change.status&&change.status.newline) { // update newline
        let prefix = change.prefix
        this.updateDatabase([prefix?'tableTree':'tree'])
        this.updateProjectionStatus(origin.tree, prefix)
      } else if (change&&change.goToProjection) { // update newline
        let prefix = change.prefix
        let thisprojection = prefix?this.store.tableProjection:this.store.projection
        let go = change.goToProjection
        let project = thisprojection.find(_ => _.path===go.path&&!!_.extraField===false)
        if (project) {
          this.store.status.sidebar = prefix?'table-projection':'projection'
          this.$refs[prefix?'table-projection':'projection'].changeSelect(project)
          this.updateDatabase(['status'])
        }
      } else { // update selected
        let prefix = change.prefix
        this.updateDatabase(prefix?['tableTree', 'tableTreeState']:['tree', 'treeState'])
      }
      if (change&&change.changeSelect) {
        let prefix = change.prefix
        let thistimer = this.timers[prefix?"tableTreeComments":"treeComments"]
        let state = this.store[prefix?"tableTreeState":"treeState"]
        let struct = this.$refs[prefix?'table-struct':'struct']

        clearTimeout(thistimer)
        let selected = state.selected
        selected = struct.nodes[selected]
        state.comments = {y:selected.$el.getBoundingClientRect().y, comments: selected.comments}
        // console.log(JSON.stringify(state), selected.comments, prefix)
        this.timers[prefix?"tableTreeComments":"treeComments"] = setTimeout(() => {
          state.comments = null
        }, this.store.config.projection.debounceDelay)
      }
    },
    onProjectionUpdate (change) {
      let prefix = change.prefix
      if (change.changeShow||change.reorder) {
        this.updateDatabase([prefix?'tableProjectionState':'projectionState'])
        this.updateDatabase([prefix?'tableProjection':'projection'])
        if (prefix) { // update table
        } else { // update list print
          clearTimeout(this.timers.onProjectionChange)
          this.timers.onProjectionChange = setTimeout(() => {
            this.onProjectionChange(this.store.projection, this.store.projection)
          }, 500)
        }
      }
      if (change.deleteProjection) {
        this.updateDatabase([prefix?"tableProjectionState":'projectionState'])
        this.removeProjection(change.deleteProjection, prefix)
        this.updateDatabase(prefix?['tableTree', 'tableProjection']:['tree', 'projection'])
        if (prefix) { // update table

        } else { // update list print
          clearTimeout(this.timers.onProjectionChange)
          this.timers.onProjectionChange = setTimeout(() => {
            this.onProjectionChange(this.store.projection, this.store.projection)
          }, 500)
        }
      }
      if (change.goToOrigin) {
        let data = change.goToOrigin
        if (data.extraField) { // goto extraField
          let extraField = this.$refs.extraField.nodes[data.path]
          if (extraField) {
            this.store.status.sidebar = 'extraField'
            extraField.select()
            this.updateDatabase(['status'])
          }
        } else { // goto struct
          if (prefix) {
            let tree = this.$refs['table-struct'].nodes[data.path]
            if (tree) {
              this.store.status.sidebar = 'table-struct'
              tree.select()
              this.updateDatabase(['status'])
            }
          } else {
            let tree = this.$refs.struct.nodes[data.path]
            if (tree) {
              this.store.status.sidebar = 'struct'
              tree.select()
              this.updateDatabase(['status'])
            }
          }
        }
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
      if (change.add) {
        this.store.extraField.push(change.add)
        this.updateDatabase(['extraField'])
      }
      if (change.modify) {
        this.updateDatabase(['extraField'])
        this.updateProjectionStatus(change.modify, 'both')
      }
      if (change.changeShow||change.reorder) {
        this.updateDatabase(['extraField'])
      }
      if (change.deleted) {
        this.removeProjection(change.deleted, 'both')
        let index = this.store.extraField.findIndex(_ => _===change.deleted)
        if (index !== -1) {
          this.store.extraField.splice(index, 1)
        }
        this.updateDatabase(['extraField'])
        this.updateDatabase(['extraFieldState'])
        this.updateProjectionStatus(change.deleted, 'both')
      }
      if (change.status&&change.status.newline) {
        this.updateDatabase(['extraField'])
        this.updateProjectionStatus(origin.data, 'both')
      }
      if (change.status&&change.status.projection!==undefined) {
        let prefix = change.prefix
        console.log('change:', change)
        if (change.status.only) {
          this.cleanProjection(prefix)
          this.addProjection(origin.data, prefix)
        } else if (change.status.projection) {
          this.addProjection(origin.data, prefix)
        } else {
          let obj = this.store[prefix?'tableProjection':'projection'].find(_ => _.path===origin.data.path)
          if (obj) {
            this.removeProjection(obj, prefix)
          } else {
            origin.data.status[prefix?'tableProjection':'projection'] = false
          }
        }
        this.updateDatabase([prefix?'tableTree':'tree'])
        this.updateDatabase(['extraField', 'extraFieldState'])
        this.updateProjectionStatus(origin.data, prefix)
      }
      if (change.goToProjection) { // update newline
        let prefix = change.prefix
        let go = change.goToProjection
        let project
        if (prefix) {
          project = this.store.tableProjection.find(_ => _.path===go.path&&_.extraField)
        } else {
          project = this.store.projection.find(_ => _.path===go.path&&_.extraField)
        }
        if (project) {
          let ref = prefix?'table-projection':'projection'
          this.store.status.sidebar = ref
          this.$refs[ref].changeSelect(project)
          this.updateDatabase(['status'])
        }
      }
    },
    onFilterUpdate (change, origin) {
      if (change.add) {
        this.store.filter.push(change.add)
        this.updateDatabase(['filter'])
      }
      if (change.modify) {
        this.updateDatabase(['filter'])
      }
      if (change.changeShow||change.reorder) {
        this.updateDatabase(['filter'])
      }
      if (change.deleted) {
        let index = this.store.filter.findIndex(_ => _===change.deleted)
        if (index !== -1) {
          this.store.filter.splice(index, 1)
        }
        this.updateDatabase(['filter'])
        this.updateDatabase(['filterState'])
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
    clickChangeSidebar (event, type) {
      let target = event.target
      let name = target.getAttribute('name')
      if (name) {
        if (type === 'sidebar') {
          this.store.status.sidebar = name
        } else if (type === 'mode') {
          this.store.status.mode = name
        }
        this.updateDatabase(['status'])
      }
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
      console.log('configChange')
      this.updateDatabase(['config'])
      this.onFilterChange(this.store.filter)
    },
    onDataChange (newValue, oldValue) {
      this.onFilterChange(this.store.filter)
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
    doProject(start, end) {
      let sortedData
      if (start === undefined) {
        sortedData = this.sortedData
      } else {
        sortedData = this.sortedData.slice(start, end)
      }
      // for table like
      //if (!oldProjects||newProjects.length!==oldProjects.length) {
      //  this.projectedData = {}
      //  for (let projection of this.store.projection) {
      //    if (!projection.extraField) { // normal fields
      //      this.projectedData[projection.path] = this.analyser.getValueByPath(sortedData, projection.path)
      //    } else { // extra fields
      //      if (projection.func) {
      //        this.projectedData[projection.path] = this.data.map(_ => projection.func(_))
      //      } else {
      //        this.projectedData[projection.path] = this.data.map(_ => undefined)
      //      }
      //    }
      //  }
      //}
      // projectionStrings
      if (this.store.projection.length===0) { // no fields
        this.projectedStrings = []
      } else {
        let result = this.prettyPrint(sortedData, this.store.projection, this.store.tree, this.store.config)
        this.projectedStrings = result
      }
    },
    onProjectionChange (newProjects, oldProjects) {
      // console.log({newProjects, oldProjects})
      // can optimize here
      if (this.store.config.global.doPrintEachPage) { // do print for each page
        this.projectedData = {}
        this.projectedStrings = []
      } else {  // do print once for all
        this.doProject()
        this.onPageChange(this.store.status.page)
      }
    },
    onPageChange (newValue, oldValue) {
      if (this.store.config.global.doPrintEachPage) { // do print for each page
        let pageSize = this.store.config.page.pageSize
        let length = this.sortedData.length
        let maxPage = Math.floor(length / pageSize)
        let start = pageSize*newValue
        let end = pageSize*(newValue+1)-1
        end = end>=length-1?length-1:end
        this.doProject(start, end+1)
        this.pageStrings = this.projectedStrings
        this.status.page = {
          maxPage, length, start, end, page: newValue
        }
      } else { // do print once for all
        let pageSize = this.store.config.page.pageSize
        let length = this.projectedStrings.length
        let maxPage = Math.floor(length / pageSize)
        let start = pageSize*newValue
        let end = pageSize*(newValue+1)-1
        end = end>=length-1?length-1:end
        this.pageStrings = this.projectedStrings.slice(start, end+1)
        this.status.page = {
          maxPage, length, start, end, page: newValue
        }
      }
    },
    _prettyPrint (data, tree, level, config) {
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
        if (this.store.config.projection.showUndefined) {
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
            thisresult = this._prettyPrint(thisdata, thistree, level+1, config)
          }
          if (config.projection.showUndefined || thisresult !== undefined) {
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
            thisresult = this._prettyPrint(eachdata, tree.children[0], level+1, config)
          } else {
            thisresult = this._prettyPrint(eachdata, tree, level+1, config)
          }
          if (this.store.config.projection.showUndefined || thisresult !== undefined) {
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
        if (this.store.config.projection.showUndefined || result !== undefined) {
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
    prettyPrint (data, projections, tree, config) {
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
            thisresult = this._prettyPrint(thisdata, thattree, 1, config)
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
          if (config.projection.showUndefined || thisresult !== undefined) {
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
.#{$pre}-show-toolbar {
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
  display: inline-flex;
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
}
.#{$pre}-list-content {
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
