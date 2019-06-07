<template>
  <div :class="`${prefixCls}`"  @keydown.prevent="keydown">
    <div :class="`${prefixCls}-tools`">
      <span
        :class="`${prefixCls}-tools-button`"
        @click="onChangeAllFold(1)"
      > + </span>
      <span
        :class="`${prefixCls}-tools-button`"
        @click="onChangeAllFold(0)"
      > - </span>
    </div>
    <div :class="`${prefixCls}-content`">
      <ac-tree-item :tree="tree" :treeState="treeState" :nodes="nodes" @update="onupdate"/>
    </div>
  </div>
</template>

<script>
const prefixCls = 'ac-table-tree'
import acTreeItem from './ac-tree-item'

export default {
  name: 'ac-table-tree',
  components: {acTreeItem},
  props: {
    tree: { type: Object, required: true },
    treeState: { type: Object, required: true },
  },
  data () {
    return {
      prefixCls,
      nodes : { },
    }
  },
  watch:{
  },
  computed: {
  },
  created() {
    this.$watch('treeState.selected', (newObj, oldObj) => {
      if (oldObj&&this.nodes[oldObj]) {
        this.nodes[oldObj].updateSelected(false)
      }
      if (newObj&&this.nodes[newObj]&&!this.nodes[newObj].tree.root) {
        this.nodes[newObj].updateSelected(true)
      }
    })
  },
  mounted () {
    let selected = this.treeState.selected
    if (selected) {
      if (this.nodes[selected]&&!this.nodes[selected].tree.root) {
        this.nodes[selected].updateSelected(true)
      }
    }
  },
  methods: {
    keydown (event) {
      console.log(event)
    },
    onupdate (change, value, origin) {
      this.$emit('update', change, value, origin)
      if (origin) {
        this.treeState.selected = origin.tree.path
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
    doForAllSubTree (root, func) {
      let children = root.$children.filter(_ => _.$options.name === 'ac-table-tree-item')
      func(root)
      if (children) {
        for (let child of children) {
          this.doForAllSubTree(child, func)
        }
      }
    },
    onChangeAllFold(status) {
      let root = this.$children.find(_ => _.$options.name === 'ac-table-tree-item')
      if (status) {
        this.doForAllSubTree(root, _=> {
          if (_.tree.root) return
          _.updateFold(status)
        })
      } else {
        this.doForAllSubTree(root, _=> {
          if (_.tree.root) return
          _.updateFold(status)
        })
      }
      this.$emit('update')
    }
  }
}
</script>

<style lang="scss">
$pre: ac-table-tree;
.#{$pre} {
}
.#{$pre}-tools {
  height: 1rem;
}
.#{$pre}-tools-button {
  padding: 0 0.5rem;
}
.#{$pre}-tools-button:hover {
  background: white;
}
.#{$pre}-content {
  padding: 0 5px;
}

</style>
