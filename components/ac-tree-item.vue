<template>
  <div :class="[tree.root?`${prefixCls}-root`:prefixCls]"
    @click.stop="onclick"
  >
    <div :class="`${prefixCls}-content`" v-if="!(tree.root)">
      <span
        ref='folder'
        :class="`${prefixCls}-folder`"
        v-show="this.tree.children"
      >
        {{this.tree.status.open?'▼':'►'}}
      </span>
      <span :class="`${prefixCls}-name`"
        @mouseover="overBody"
        @mouseleave="leaveBody">
        {{tree.name}}
      </span>
    </div>
    <div v-if="!!tree.children" v-show="tree.root||tree.status.open" style="position: relative">
      <div ref="vbar"
           :class="`${prefixCls}-vbar`"
           @mouseover="overBody"
           @mouseleave="leaveBody"
      />
      <ac-tree-item
         v-for="child of tree.children"
        :keys="child.path"
        :tree="child"
        :level="level+1"
      />
    </div>
  </div>
</template>

<script>
const prefixCls = 'ac-table-tree-item'

export default {
  name: 'ac-table-tree-item',
  props: {
    tree: { type: Object, default () { return {} } },
    level: { type: Number, default:0 },
  },
  data () {
    return {
      prefixCls,
      status: {
        folder: false
      }
    }
  },
  computed: {
  },
  mounted () {
    //this.$el.style.setProperty('left', 2*this.level + 'em')
  },
  methods: {
    overBody (event) {
      if (this.$refs.folder) {
        this.$el.style.setProperty('background', '#d8ffd7')
        this.$refs.folder.style.setProperty('opacity', 1)
        if (this.$refs.vbar) {
          this.$refs.vbar.style.setProperty('background', '#d8ffd7')
        }
      }
    },
    leaveBody (event) {
      if (this.$refs.folder) {
        this.$el.style.removeProperty('background')
        this.$refs.folder.style.removeProperty('opacity')
        if (this.$refs.vbar) {
          this.$refs.vbar.style.removeProperty('background')
        }
      }
    },
    onclick (event) {
       this.tree.status.open = !this.tree.status.open
       this.$forceUpdate()
    }
  },
  beforeCreate: function () {
    this.$options.components.acTreeItem = require('./ac-tree-item.vue').default
  },
}
</script>

<style lang="scss">
$pre: ac-table-tree-item;
.#{$pre}-root {
  position: relative;
}
.#{$pre} {
  position: relative;
  left: 1rem;
  padding-right: 1rem;
}
.#{$pre}-folder {
  opacity: 0.3;
  position: absolute;
  left: -0.6rem;
}
.#{$pre}-content {
  display: flex;
}
.#{$pre}-name {
  flex:1
}
.#{$pre}-vbar {
  position: absolute;
  left: -0.6rem;
  width: 1.6rem;
  height: 100%;
}
</style>
