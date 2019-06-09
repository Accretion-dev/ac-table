<template>
  <div
    :class="{
      [tree.root?`${prefixCls}-root`:prefixCls]: true,
    }"
    @click.stop="onclick"
  >
    <!-- [`${prefixCls}-selected`]: this.level&&this.treeState.selected===this.tree.path -->
    <template v-if="tree.root">
      <div ref="subtree" v-if="!!tree.children" :class="`${prefixCls}-subtree`">
        <ac-tree-item
           ref="subtrees"
           v-for="(child,index) of tree.children"
          :key="child.path"
          :index="index"
          :siblingCount="tree.children.length"
          :tree="child"
          :level="level+1"
          :treeState="treeState"
          :nodes="nodes"
          @update="onupdate"
        />
      </div>
    </template>
    <template v-else>
      <template v-if="tree.children">  <!--not root but have children-->
        <div ref="content" :class="`${prefixCls}-content`">
          <span
            ref='folder'
            :class="[`${prefixCls}-folder`, 'ac-unselectable']"
            @mouseover="overBody"
            @mouseleave="leaveBody"
          >
            <span> ► </span>
            <span ref="folderOpen" :class="`${prefixCls}-folder-open`" v-show="tree.status.open"> ▼ </span>
          </span>
          <span :class="`${prefixCls}-title`" @mouseover="overBody" @mouseleave="leaveBody">
            <span v-if="icon.array">
              <span class="ac-unselectable">[</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">]</span>
            </span>
            <span v-else>
              <span class="ac-unselectable">&nbsp;</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">&nbsp;</span>
            </span>
            <span ref="name" :class="{
                [`${prefixCls}-name`]:true,
                ['ac-unselectable']:true,
                [`${prefixCls}-shown`]: shown,
              }"
            >
              {{tree.name}}
            </span>
          </span>
        </div>
        <div ref="subtree" :class="`${prefixCls}-subtree`" v-show="tree.status.open">
          <div ref="vbar"
               :class="`${prefixCls}-vbar`"
               @mouseover="overBody"
               @mouseleave="leaveBody"
          />
          <ac-tree-item
             ref="subtrees"
             v-for="(child,index) of tree.children"
            :key="child.path"
            :index="index"
            :siblingCount="tree.children.length"
            :tree="child"
            :level="level+1"
            :treeState="treeState"
            :nodes="nodes"
            @update="onupdate"
          />
        </div>
      </template>
      <template v-else> <!--not root and not have children-->
        <div ref="content" :class="`${prefixCls}-content`">
          <span :class="`${prefixCls}-title`" @mouseover="overBody" @mouseleave="leaveBody">
            <span v-if="icon.array">
              <span class="ac-unselectable">[</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">]</span>
            </span>
            <span v-else>
              <span class="ac-unselectable">&nbsp;</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">&nbsp;</span>
            </span>
            <span ref="name" :class="{
                [`${prefixCls}-name`]:true,
                'ac-unselectable':true,
                [`${prefixCls}-shown`]: shown,
              }"
            >
              {{tree.name}}
            </span>
          </span>
        </div>
      </template>
    </template>
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
  'empty': 'E',
}

export default {
  name: 'ac-table-tree-item',
  components: {icons},
  props: {
    tree: { type: Object, required: true },
    level: { type: Number, default:0 },
    treeState: { type: Object, required: true },
    nodes: { type: Object, required: true },
    index: { type: Number },
    siblingCount: { type: Number },
  },
  data () {
    return {
      prefixCls,
      status: {
        folder: false,
        open: false,
      },
      childMap: { },
    }
  },
  computed: {
    shown () {
      return this.tree.status.show
    },
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
    if (this.$refs.subtrees) {
      for (let child of this.$refs.subtrees) {
        this.childMap[child.index] = child
      }
    }
  },
  created () {
    this.nodes[this.tree.path] = this
  },
  methods: {
    onlyUpdateFold (value) {
      this.tree.status.open = value
    },
    updateFold (value) {
      if (value===undefined) value = !this.tree.status.open
      if (this.tree.status.open!=value) {
        this.tree.status.open = value
        this.$emit('update', {status:{open:this.tree.status.open}, treeState:{selected: this.tree.path}}, this.tree, this)
      } else if (!this.tree.status.open && !value) {
        if (!this.tree.root&&!this.$parent.tree.root) {
          this.$parent.updateFold(false)
        } else {
          this.$emit('update', {status:{open:this.tree.status.open}, treeState:{selected: this.tree.path}}, this.tree, this)
        }
      }
    },
    updateShow () {
      let status = !this.tree.status.show
      this.$emit('update', {status:{show:status}}, this.tree, this)
    },
    updateSelected (value) {
      if (value) {
        this.$el.classList.add(`${prefixCls}-selected`)
      } else {
        this.$el.classList.remove(`${prefixCls}-selected`)
      }
      if (this.$refs.content) {
        this.$refs.content.scrollIntoViewIfNeeded()
      }
    },
    overBody (event) {
      this.$el.style.setProperty('background', '#d8ffd7')
      this.treeState.comments = {y:this.$el.getBoundingClientRect().y, comments: this.comments}
      //this.$refs.comments.style.setProperty('display', 'unset')
      if (this.$refs.folder) {
        this.$refs.folder.style.setProperty('opacity', 1)
      }
      if (this.$refs.vbar) {
        this.$refs.vbar.style.setProperty('background', '#d8ffd7')
      }
    },
    leaveBody (event) {
      this.$el.style.removeProperty('background')
      this.treeState.comments = null
      //this.$refs.comments.style.setProperty('display', 'none')
      if (this.$refs.folder) {
        this.$refs.folder.style.removeProperty('opacity')
      }
      if (this.$refs.vbar) {
        this.$refs.vbar.style.removeProperty('background')
      }
    },
    onclick (event) {
      const goodType = ['array', 'object', 'mixed']
      if (goodType.includes(this.tree.type)) {
        this.updateFold(!this.tree.status.open)
      } else {
        this.$emit('update', {treeState:{selected: this.tree.path}}, this.tree, this)
      }
    },
    onupdate (change, value, origin) {
      this.$emit('update', change, value, origin)
    },
  },
  beforeCreate: function () {
    this.$options.components.acTreeItem = require('./ac-tree-item.vue').default
  },
}
</script>

<style lang="scss">
$pre: ac-table-tree-item;
.#{$pre}-shown {
  color: green;
  font-weight: bolder;
}
.#{$pre}-selected {
  background: #d8ffd775;
}
.#{$pre}-root {
  position: relative;
}
.#{$pre}-subtree {
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
.#{$pre}-folder-open {
  position: absolute;
  background:white;
  top:0px;
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
