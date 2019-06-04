<template>
  <div :class="prefixCls">
    <div :class="`${prefixCls}-show-button`"> </div>
    <div :class="`${prefixCls}-header`"> </div>
    <div :class="`${prefixCls}-main`">
      <div :class="`${prefixCls}-sidebar`">
        <ac-tree :class="`${prefixCls}-sidebar-tree`"
                 :tree="tree"
        />
      </div>
      <div :class="`${prefixCls}-content`"> </div>
    </div>
    <div :class="`${prefixCls}-footer`">
      <span>
        {{ data.length }}
      </span>
    </div>
  </div>
</template>

<script>
const prefixCls = 'ac-table'
import {JsonAnalyser} from '../utils/jsonAnalyser.js'
import acTree from './ac-tree'

export default {
  name: 'ac-table',
  components: {acTree},
  props: {
    data: { type: Array, default () { return [] } }
  },
  data () {
    return {
      prefixCls
    }
  },
  computed: {
    tree () {
      let analyser = new JsonAnalyser()
      let {structTree, tree} = analyser.analysis(this.data)
      this.goThrough(tree, _ => {
        _.status={
          open:false
        }
      })
      return tree
    }
  },
  methods: {
    goThrough(root, func) {
      func(root)
      if (root.children) {
        for (let child of root.children) {
          this.goThrough(child, func)
        }
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
}
.#{$pre}-header {
  height: 2em;
  background: #ffeb3c;
}
.#{$pre}-main {
  display: flex;
  flex: 1;
}
.#{$pre}-sidebar {
  background: #ffd24a;
  display: flex;
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

</style>
