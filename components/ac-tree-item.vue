<template>
  <div :class="[tree.root?`${prefixCls}-root`:prefixCls]"
    @click.stop="onclick"
  >
    <div :class="`${prefixCls}-content`" v-if="!(tree.root)">
      <span
        ref='folder'
        :class="`${prefixCls}-folder`"
        v-show="tree.children"
      >
        {{this.tree.status.open?'▼':'►'}}
      </span>
      <span :class="`${prefixCls}-title`"
        @mouseover="overBody"
        @mouseleave="leaveBody">
        <span v-if="icon.array">
          <span>[</span><icons :name="icon.type" size="0.9em"/><span>]</span>
        </span>
        <span v-else>
          <span>&nbsp;</span><icons :name="icon.type" size="0.9em"/><span>&nbsp;</span>
        </span>
        <span :class="`${prefixCls}-name`">{{tree.name}}</span>
      </span>
      <pre ref="comments" :class="`${prefixCls}-comments`">{{comments}}</pre>
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
import icons from '../icons/icons.vue'
const typeMap = {
  'string': 'S',
  'boolean': 'B',
  'number': 'N',
  'date': 'D',
  'mixed': 'M',
  'array': 'A',
  'object': 'O',
}

export default {
  name: 'ac-table-tree-item',
  components: {icons},
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
    comments () {
      let result = [`|${this.tree.path}`]
      if (this.tree.count) {
        result.push(`count: ${this.tree.count}`)
      }
      if (this.tree.null) {
        result.push(`null: ${this.tree.null}`)
      }
      return result.join(", ")
    },
    icon () {
      if (!this.tree.type) { return {type: 'B_U', array: false} }
      if (this.tree.arrayType) {
        return {
          type: 'R_'+typeMap[this.tree.arrayType],
          array: true
        }
      } else {
        return {
          type: 'B_'+typeMap[this.tree.type],
          array: false
        }
      }
    }
  },
  mounted () {
    //this.$el.style.setProperty('left', 2*this.level + 'em')
  },
  methods: {
    overBody (event) {
      if (this.$refs.folder) {
        this.$el.style.setProperty('background', '#d8ffd7')
        this.$refs.folder.style.setProperty('opacity', 1)
        this.$refs.comments.style.setProperty('display', 'unset')
        if (this.$refs.vbar) {
          this.$refs.vbar.style.setProperty('background', '#d8ffd7')
        }
      }
    },
    leaveBody (event) {
      if (this.$refs.folder) {
        this.$el.style.removeProperty('background')
        this.$refs.folder.style.removeProperty('opacity')
        this.$refs.comments.style.setProperty('display', 'none')
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
  margin-right: 1rem;
}
.#{$pre}-folder {
  opacity: 0.3;
  position: absolute;
  left: -0.6rem;
}
.#{$pre}-content {
  display: flex;
}
.#{$pre}-title {
  flex:1
}
.#{$pre}-name {
  padding-left: 0.1em;
}
.#{$pre}-name span {
  padding: 0;
}
.#{$pre}-vbar {
  position: absolute;
  left: -0.6rem;
  width: 1.6rem;
  height: 100%;
}
.#{$pre}-comments {
  margin: 0;
  position: absolute;
  background: #d8ffd7;
  left: 100%;
  display: none;
}


</style>
