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
            <span name="tree" :class="{[`${prefixCls}-sidebar-tab-selected`]:sidebar==='tree'}"><span class="ac-unselectable" style="pointer-events:none;">tree</span></span>
            <span name="show" :class="{[`${prefixCls}-sidebar-tab-selected`]:sidebar==='show'}"><span class="ac-unselectable" style="pointer-events:none;">show</span></span>
          </div>
          <keep-alive>
            <ac-tree ref="tree"
              :class="`${prefixCls}-sidebar-tree`"
              :tree="tree"
              :treeState="treeState"
              @update="onTreeUpdate"
              v-if="sidebar==='tree'"
            />
          </keep-alive>
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

/*
TODO:
* add view mode
* write filter syntax
* add tabs for sidebar
* design toolbar
*/

export default {
  name: 'ac-table',
  components: {acTree},
  props: {
    data: { type: Array, default () { return [] } },
    uuid: { type: String, default () { return (new Date()).toISOString() }},
  },
  data () {
    return {
      prefixCls,
      db: null,
      loading: true,
      analyser: null,
      tree: {root: true, status:{open:false}},
      treeState: { selected: null },
      sidebar: 'tree',
      timers: {
        updateDatabase: null,
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
  computed: {
  },
  created () {
    this.initDatabase().catch(error => {// in case of error, do not use database
      console.error(error)
      this.loading = false
      this.initTree()
    })
  },
  mounted () {
  },
  methods: {
    keydown (event) {
      console.log(event)
    },
    async initDatabase () {
      if (!window.indexedDB) {
        throw Error('no support for indexedDB')
      } else {
        let db = await openDB('ac-table', 1, {
          upgrade (db, oldVersion, newVersion, transaction) {
            //db.createObjectStore('trees', { keyPath: 'uuid' })
            db.createObjectStore('trees')
          }
        })
        let tx = db.transaction('trees', 'readwrite')
        let data = await db.get('trees', this.uuid)
        if (!data) {
          this.initTree()
          await db.put('trees', {tree: this.tree, treeState: this.treeState}, this.uuid)
        } else {
          this.initTree(data)
        }
        // clean old trees
        let keys = await db.getAllKeys('trees')
        let now = new Date()
        keys = keys.filter(_ => !isNaN(new Date(_)))
        keys = keys.slice(10) // leave the latest 3 random trees
        for (let each of keys) {
          await db.delete('trees', each)
        }
        await tx.done
        this.db = db
        this.loading = false
      }
    },
    updateDatabase () {
      clearTimeout(this.timers.updateDatabase)
      this.timers.updateDatabase = setTimeout(async () => {
        let db = this.db
        let tx = db.transaction('trees', 'readwrite')
        await db.put('trees', {tree: this.tree, treeState: this.treeState}, this.uuid)
        await tx.done
        this.statusBarInfo('save tree state', 'info')
      }, 3000)
    },
    async cleanCurrentDatabase () {
      let db = this.db
      let tx = db.transaction('trees', 'readwrite')
      let exists = await db.get('trees', this.uuid)
      if (exists) {
        await db.delete('trees', this.uuid)
        console.log('clean current database')
      }
      await tx.done
    },
    async cleanAllDatabase () {
      let db = this.db
      let tx = db.transaction('trees', 'readwrite')
      let keys = await db.getAllKeys('trees')
      for (let each of keys) {
        await db.delete('trees', each)
        console.log('clean all database')
      }
      await tx.done
    },
    initTree (data) {
      if (data) {
        this.analyser = new JsonAnalyser({tree:data.tree})
        this.tree = data.tree
        this.treeState = data.treeState
      } else {
        this.analyser = new JsonAnalyser()
        this.genTree(this.data)
      }
    },
    genTree (data) {
      let {structTree, tree} = this.analyser.analysis(data)
      this.goThrough(tree, _ => {
        this.$set(_,'status',{open:false})
      })
      this.tree = tree
    },
    onTreeUpdate (change, value, origin) {
      this.$emit('update', change, value, origin)
      this.updateDatabase()
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
      this.sidebar = target.getAttribute('name')
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
.#{$pre}-sidebar-tree {
  flex:1;
  margin: 2px;
}
.#{$pre}-content {
  background: #8bc34a;
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
