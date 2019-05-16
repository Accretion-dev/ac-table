<template>
  <div :class="prefixCls">
    <div :class="{[`${prefixCls}-show-button`]: true}"> </div>
    <div :class="{[`${prefixCls}-header`]: true}"> </div>
    <div :class="{[`${prefixCls}-main`]: true}">
      <div :class="{[`${prefixCls}-sidebar`]: true}">
        <ac-tree :class="{[`${prefixCls}-sidebar-tree`]: true}"
                 :tree="tree"
        />
      </div>
      <div :class="{[`${prefixCls}-content`]: true}"> </div>
    </div>
    <div :class="{[`${prefixCls}-footer`]: true}">
      <span >
        {{data.length}}
      </span>
    </div>
  </div>
</template>

<script>
const prefixCls = 'ac-table'
import {analysisJson} from './tools.js'
import acTree from './ac-tree'

export default {
  name: 'ac-table',
  components: {acTree},
  props: {
    data: { type: Array, default () { return [] } }
  },
  computed: {
    tree () {
      let {structTree, tree} = analysisJson(this.data)
      return tree
    }
  },
  data () {
    return {
      prefixCls
    }
  },
}
</script>

<style lang="scss">
$pre: ac-table;
.#{$pre} {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 20em;
  height: 80vh;
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
  width: 300px;
}
.#{$pre}-sidebar-tree {
  margin: 1em;
  flex: 1;
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
