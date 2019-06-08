<template>
  <div :class="prefixCls">
    <div :class="`${prefixCls}-show-button`"> </div>
    <div :class="`${prefixCls}-header`">
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
        <div :class="`${prefixCls}-sidebar`">
          <div :class="`${prefixCls}-sidebar-tab`" @click="changeSidebar">
            <span name="tree" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='tree'}">
              <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">tree</span>
            </span>
            <span name="show" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='show'}">
              <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">show</span>
            </span>
            <span name="extra" :class="{[`${prefixCls}-sidebar-tab-selected`]:store.status.sidebar==='extra'}">
              <span class="ac-unselectable" style="pointer-events:none; padding: 0 0.5rem;">extra</span>
            </span>
          </div>
          <ac-tree ref="tree"
            :tree="store.tree"
            :treeState="store.treeState"
            @update="onTreeUpdate"
            v-show="store.status.sidebar==='tree'"
          />
          <ac-tree-show ref="show"
            :show="store.showFields"
            v-show="store.status.sidebar==='show'"
          />
        </div>
        <div :class="`${prefixCls}-resizer`">
          <span style="width:1px; background:gray; margin-right:2px;"/>
        </div>
        <div :class="`${prefixCls}-content`"> </div>
      </template>
    </div>
    <div :class="`${prefixCls}-footer`">
      <span>
        {{ data.length }}
      </span>
      <span :class="`${prefixCls}-status-message`"
            :style="{'font-color':`${messageColor[message.type]}`}"
            v-show="message.show"
      >
        {{message.text}}
      </span>
    </div>
  </div>
</template>

<script>
const prefixCls = 'ac-table'
import {JsonAnalyser} from '../utils/jsonAnalyser.js'
import { openDB, deleteDB, wrap, unwrap } from 'idb'
import acTree from './ac-tree'
import acTreeShow from './ac-tree-show'

/*
TODO:
* add view mode
* write filter syntax
* add tabs for sidebar
* design toolbar
*/

export default {
  name: 'ac-table',
  components: {acTree, acTreeShow},
  props: {
    data: { type: Array, default () { return [] } },
    uid: { type: String, default () { return (new Date()).toISOString() }},
  },
  data () {
    return {
      prefixCls,
      db: null,
      loading: true,
      analyser: null,
      store: {
        tree: {root: true, status:{open:false}},
        treeState: { selected: null },
        extraFields: [],
        showFields:[],
        status: {
          sidebarSize: null,
          sidebar: 'tree',
        },
      },
      timers: {
        updateDatabase: {
          all: null
        },
        message: null,
      },
      message: {
        text: '',
        type: 'info',
        show: false
      },
      messageColor: {
        'info': 'blue',
        'error': 'red',
      }
    }
  },
  watch: {
  },
  computed: {
  },
  created () {
    let watcher = (value) => {
      let node
      if (value==='tree') {
        node = this.$refs.tree
      } else if (value==='show') {
        node = this.$refs.show
      }
      if (node) {
        setTimeout(() => {
          node.$el.focus()
        },0)
      }
    }
    this.$watch('store.status.sidebar', watcher)

    this.initDatabase().catch(error => {// in case of error, do not use database
      console.error(error)
      this.loading = false
      this.initTree()
    })
  },
  mounted () {
  },
  methods: {
    // about database and init
    async saveState(key, tx) {
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
    async initDatabase () {
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
            await stores.delete(each)
          }
        }
        this.db = db
        this.loading = false
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
    },
    async cleanAllDatabase () {
      let keys = Object.keys(this.store)
      let db = this.db
      let tx = db.transaction(['uids',...keys], 'readwrite')
      let uidsStore = tx.objectStore('uids')
      let uids = await uidsStore.getAllKeys()
      for (let key of Object.keys(stores)) {
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
        this.$set(_,'status',{
          open:false,
          show:false
        })
      })
      tree.children.forEach(_ => {
        this.addShow(_)
      })
      this.store.tree = tree
    },
    // about show
    addShow(tree, extra) {
      tree.status.show = true
      let toAdd = {
        name: tree.name,
        path: tree.path, // uid for extraFields
        type: tree.type,
        arrayType: tree.arrayType,
        extra,
        status: {
          show: true
        },
      }
      this.store.showFields.push(toAdd)
    },
    removeShow(obj) {
      let index = this.store.showFields.findIndex(_ => _===obj)
      let tree
      if (obj.extra) {
        tree = this.extraFields.find(_ => _.path === obj.path)
      } else {
        tree = this.$refs.tree.nodes[obj.path].tree
      }
      tree.status.show = false
      this.store.showFields.splice(index, 1)
    },
    // others
    onTreeUpdate (change, value, origin) {
      if (change&&change.storeUpdate) {
        this.updateDatabase(change.storeUpdate)
      } else if (change&&change.status&&change.status.show!==undefined) {
        if (change.status.show) {
          this.addShow(origin.tree)
        } else {
          let obj = this.store.showFields.find(_ => _.path===origin.tree.path && !_.extra)
          if (obj) {
            this.removeShow(obj)
          }
        }
        this.updateDatabase(['tree', 'showFields'])
      } else { // update selected
        this.updateDatabase(['tree', 'treeState'])
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
    changeSidebar(event) {
      let target = event.target
      this.store.status.sidebar = target.getAttribute('name')
      this.updateDatabase(['status'])
    },
    statusBarInfo(text, type, timeout) {
      if (!timeout) timeout = 3000
      if (type) this.message.type = type
      this.message.text = text
      clearTimeout(this.timers.message)
      this.message.show = true
      this.timers.message = setTimeout(() => {
        this.message.show = false
      }, timeout)
    }
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
}
.#{$pre}-loading {
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
}
.#{$pre}-sidebar {
  display: flex;
  flex-direction: column;
}
.#{$pre}-resizer {
  cursor: ew-resize;
  display: flex;
}
.#{$pre}-sidebar-tab {
  background: #f7faff;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #cfcfcf;
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
  //background: #8bc34a;
  flex: 1;
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
