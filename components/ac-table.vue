<template>
  <div
    :class="`${prefixCls}`"
    @mousedown="mousedown"
    @mouseup="mouseup"
    @mousemove="mousemove"
    @dblclick="doubleclick"
  >
    <div>
      <pre
        v-show="store.treeState.comments&&!loading"
        ref="tree-comments"
        :class="`${prefixCls}-tree-comments`"
      >{{ store.treeState.comments?store.treeState.comments.comments:"" }}</pre>
      <div :class="`${prefixCls}-masker`" :style="{'z-index': masker?100:-1}" />
    </div>
    <div :class="`${prefixCls}-show-button`">
      B
    </div>
    <div :class="`${prefixCls}-header`">
      <span
        :class="`${prefixCls}-toolbar`"
        :style="{background: status.sidebarShow?'#d8ffd7':'unset'}"
        @click="status.sidebarShow=!status.sidebarShow"
      >
        T
      </span>
      <div :class="`${prefixCls}-sidebar-tab`" @click="changeSidebar">
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
    </div>
    <div :class="`${prefixCls}-main`">
      <template v-if="loading">
        <div :class="`${prefixCls}-loading`">
          loading...
        </div>
      </template>
      <template v-else>
        <div v-show="status.sidebarShow" ref="sidebar-wrapper" :class="`${prefixCls}-sidebar-wrapper`" @keydown="sidebarKeydown">
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
          <div v-for="(pdata,index) in projectedStrings" :key="index" :class="`${prefixCls}-print-line`">
            <span :class="`${prefixCls}-print-index`" :style="{width: `${digital}em`}">{{ index }}</span>
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
      projectedStrings: [],
      store: {
        tree: {root: true, status:{open:true}},
        treeState: {
          selected: null,
          comments: null,
        },
        extraFields: [],
        projectionFields:[],
        status: {
          sidebar: 'tree',
        },
      },
      status: {
        sidebarShow: true,
        resizing: false
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
      configDetail: {
        projection: {
          showUndefined: { type: 'boolean', default: true, },
          maxItem: { type: 'number', default: 100, },
          moreCount: { type: 'number', default: 100 },
          pageMode: { type: 'boolean', default: false },
          pageSize: { type: 'number', default: 1 },
        },
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
    allConfigs () {
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
    let watcher = (value) => {
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
    }
    this.$watch('store.status.sidebar', watcher)
    this.$watch('store.projectionFields', this.onProjectionChange)

    this.init()
  },
  mounted () {
  },
  methods: {
    async init () {
      try {
        await this.initDatabase()
        this.onFilterChange()
      } catch (e) {
        console.error(error)
        this.loading = false
        this.initTree()
      }
    },
    // about database and init
    async saveState (key, tx) {
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
    async initDatabase (initial = {}) {
      if (!window.indexedDB) {
        throw Error('no support for indexedDB')
      } else {
        let keys = Object.keys(this.store)
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
        let data = await uidsStore.get(this.uid)
        if (!data) { // gen new tree
          this.statusBarInfo(`gen new tree`, 'info')
          this.initTree()
          await this.saveState(null, tx)
        } else {
          this.statusBarInfo(`use old tree`, 'info')
          data = {}
          for (let key of keys) {
            data[key] = await tx.objectStore(key).get(this.uid)
          }
          this.initTree(data)
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
    updateDatabase (fields) {
      let keys = Object.keys(this.store)
      let timer = ['uids', ...keys]
      if (fields) timer = fields
      for (let field of fields) {
        clearTimeout(this.timers.updateDatabase[field])
        this.timers.updateDatabase[field] = setTimeout(async () => {
          let db = this.db
          let tx = db.transaction(field, 'readwrite')
          await this.saveState(field, tx)
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
    initTree (data) {
      if (data) {
        this.analyser = new JsonAnalyser({tree:data.tree})
        Object.assign(this.store, data)
      } else {
        this.analyser = new JsonAnalyser()
        this.genTree(this.data)
      }
    },
    genTree (data) {
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
      this.store.tree = tree
    },
    // sidebar
    sidebarKeydown (event) {
      if (event.shiftKey) {
        switch (event.key) {
          case 'Tab':
            event.preventDefault()
            event.stopPropagation()
            this.switchTab(-1)
            break
        }
      } else {
        switch (event.key) {
          case 'Tab':
            event.preventDefault()
            event.stopPropagation()
            this.switchTab(1)
            break
        }
      }
    },
    switchTab (value) {
      let tabs = ['tree', 'projection', 'extra']
      let cIndex = tabs.findIndex(_ => _===this.store.status.sidebar)
      let nIndex = (cIndex + tabs.length + value) % tabs.length
      console.log(nIndex, value)
      this.store.status.sidebar = tabs[nIndex]
    },
    // about show
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
    changeSidebar (event) {
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
    onFilterChange (newValue, oldValue) {
      this.filteredData = this.data
      this.onProjectionChange(this.store.projectionFields, this.store.projectionFields)
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
  max-height: 90vh;
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
.#{$pre}-show-button {
  position: absolute;
  right:  1em;
  top: 1em;
  width:  3em;
  height: 3em;
  background: #bffff9;
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
