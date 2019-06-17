<template>
  <div
    :class="{
      [tree.root?`${prefixCls}-root`:prefixCls]: true,
    }"
    @click.stop="onclick"
  >
    <!-- [`${prefixCls}-selected`]: this.level&&this.treeState.selected===this.tree.path -->
    <template v-if="tree.children">  <!--not root but have children-->
      <div ref="content" :class="`${prefixCls}-content`">
        <span
          v-if="!tree.root"
          ref="folder"
          :class="[`${prefixCls}-folder`, 'ac-unselectable']"
          @mouseover="overBody"
          @mouseleave="leaveBody"
          @click.stop="onclick($event, true)"
        >
          <span> ► </span>
          <span v-show="tree.status.open" ref="folderOpen" :class="`${prefixCls}-folder-open`"> ▼ </span>
        </span>
        <span :class="`${prefixCls}-title`" @mouseover="overBody" @mouseleave="leaveBody">
          <span v-if="icon.array">
            <span class="ac-unselectable">[</span>
            <icons :name="icon.type" size="0.9em" />
            <span class="ac-unselectable">]</span>
          </span>
          <span v-else>
            <span class="ac-unselectable">&nbsp;</span>
            <icons :name="icon.type" size="0.9em" />
            <span class="ac-unselectable">&nbsp;</span>
          </span>
          <span
            ref="name"
            :class="{
              [`${prefixCls}-name`]:true,
              ['ac-unselectable']:true,
              [`${prefixCls}-projection`]: projection,
            }"
          >
            <span style="padding-left:0.1rem; padding-right:0.3rem;"> {{ tree.name }} </span>
            <icons :style="{visibility: tree.status.noFirstNewline?'visible':'hidden'}" name="no_pre_newline" size="0.9rem" />
            <icons :style="{visibility: tree.status.noNewline?'visible':'hidden'}" name="no_newline" size="0.9rem" />
            <icons :style="{visibility: tree.status.noProFirstNewline?'visible':'hidden'}" name="no_pre_newline_green" size="0.9rem" />
            <icons :style="{visibility: tree.status.noProNewline?'visible':'hidden'}" name="no_newline_green" size="0.9rem" />
          </span>
        </span>
      </div>
      <div v-if="tree.status.open" ref="subtree" :class="`${prefixCls}-subtree`">
        <div ref="vbar"
             :class="`${prefixCls}-vbar`"
             @mouseover="overBody"
             @mouseleave="leaveBody"
        />
        <ac-tree-item
          v-for="(child,thisindex) of tree.children"
          ref="subtrees"
          :key="child.path"
          :index="thisindex"
          :sibling-count="tree.children.length"
          :tree="child"
          :level="level+1"
          :tree-state="treeState"
          :nodes="nodes"
          @update="onupdate"
        />
      </div>
    </template>
    <template v-else> <!--not root and not have children-->
      <div ref="content" :class="`${prefixCls}-content`">
        <span :class="`${prefixCls}-title`" @mouseover="overBody" @mouseleave="leaveBody">
          <span v-if="icon.array">
            <span class="ac-unselectable">[</span>
            <icons :name="icon.type" size="0.9em" />
            <span class="ac-unselectable">]</span>
          </span>
          <span v-else>
            <span class="ac-unselectable">&nbsp;</span>
            <icons size="0.9em" :name="icon.type" />
            <span class="ac-unselectable">&nbsp;</span>
          </span>
          <span
            ref="name"
            :class="{
              [`${prefixCls}-name`]:true,
              'ac-unselectable':true,
              [`${prefixCls}-projection`]: projection,
            }"
          >
            <span style="padding-left:0.1rem; padding-right:0.3rem;"> {{ tree.name }} </span>
            <icons :style="{visibility: tree.status.noFirstNewline?'visible':'hidden'}" name="no_pre_newline" size="0.9rem" />
            <icons :style="{visibility: tree.status.noNewline?'visible':'hidden'}" name="no_newline" size="0.9rem" />
            <icons :style="{visibility: tree.status.noProFirstNewline?'visible':'hidden'}" name="no_pre_newline_green" size="0.9rem" />
            <icons :style="{visibility: tree.status.noProNewline?'visible':'hidden'}" name="no_newline_green" size="0.9rem" />
          </span>
        </span>
      </div>
    </template>
  </div>
</template>

<script>
const prefixCls = 'ac-table-tree-item'
import icons from '../icons/icons.vue'
const typeMap = {
  'string': 'S',
  'boolean': 'B',
  'number': '1',
  'null': 'N',
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
    index: { type: Number, default: 0},
    siblingCount: { type: Number, default: 0},
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
    projection () {
      return this.tree.status.projection
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
          type: 'B_'+typeMap[this.tree.arrayType],
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
  beforeCreate: function () {
    this.$options.components.acTreeItem = require('./ac-tree-item.vue').default
  },
  methods: {
    onlyUpdateFold (value) {
      this.tree.status.open = value
    },
    updateNewline (status) {
      if (this.tree.type==='array' || this.tree.type==='object') {
        if (status) {
          this.tree.status.noNewline = status.noNewline
          if (status.noFirstNewline!==undefined) {
            this.tree.status.noFirstNewline = status.noFirstNewline
          }
        } else {
          let pre = this.tree.status.noFirstNewline
          let suf = this.tree.status.noNewline
          if (!pre && !suf) {
            this.tree.status.noFirstNewline = true
          } else if (pre && !suf) {
            this.tree.status.noNewline = true
            this.tree.status.noFirstNewline = true
          } else if (pre && suf) {
            this.tree.status.noNewline = true
            this.tree.status.noFirstNewline = false
          } else {
            this.tree.status.noNewline = false
            this.tree.status.noFirstNewline = false
          }
        }
        this.$emit('update', {status:{newline: {
          noNewline: this.tree.status.noNewline,
          noFirstNewline: this.tree.status.noFirstNewline,
        }} }, this.tree, this)
      } else if (this.tree.type==='mixed') {
        if (status) {
          this.tree.status.noNewline = status.noNewline
        } else {
          this.tree.status.noNewline = !this.tree.status.noNewline
        }
        if (!this.$refs.subtrees) {
          this.updateFold(true)
          setTimeout(() => {
            for (let subnode of this.$refs.subtrees) {
              subnode.updateNewline({noNewline: this.tree.status.noNewline})
            }
            this.$emit('update', {status:{newline: {
              noNewline: this.tree.status.noNewline,
            }} }, this.tree, this)
          }, 0)
        } else {
          for (let subnode of this.$refs.subtrees) {
            subnode.updateNewline({noNewline: this.tree.status.noNewline})
          }
          this.$emit('update', {status:{newline: {
            noNewline: this.tree.status.noNewline,
          }} }, this.tree, this)
        }
      } else {
        if (status) {
          this.tree.status.noNewline = status.noNewline
        } else {
          this.tree.status.noNewline = !this.tree.status.noNewline
        }
        this.$emit('update', {status:{newline: {
          noNewline: this.tree.status.noNewline,
        }} }, this.tree, this)
      }
    },
    updateProNewline (status) {
      if (status) {
        this.tree.status.noProNewline = status.noProNewline
        if (status.noProFirstNewline!==undefined) {
          this.tree.status.noProFirstNewline = status.noProFirstNewline
        }
      } else {
        let pre = this.tree.status.noProFirstNewline
        let suf = this.tree.status.noProNewline
        if (!pre && !suf) {
          this.tree.status.noProFirstNewline = true
        } else if (pre && !suf) {
          this.tree.status.noProNewline = true
          this.tree.status.noProFirstNewline = true
        } else if (pre && suf) {
          this.tree.status.noProNewline = true
          this.tree.status.noProFirstNewline = false
        } else {
          this.tree.status.noProNewline = false
          this.tree.status.noProFirstNewline = false
        }
      }
      this.$emit('update', {status:{newline: {
        noProNewline: this.tree.status.noProNewline,
        noProFirstNewline: this.tree.status.noProFirstNewline,
      }} }, this.tree, this)
    },
    updateFold (value) {
      if (this.tree.root) return
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
    updateProjection () {
      if (this.tree.root) return
      let status = !this.tree.status.projection
      this.$emit('update', {status:{projection:status}}, this.tree, this)
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
      if(this.tree.root) return
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
    onclick (event, direct) {
      const goodType = ['array', 'object', 'mixed']
      if (this.tree.root) {
        this.$emit('update', {treeState:{selected: this.tree.path}}, this.tree, this)
        return
      }
      if (goodType.includes(this.tree.type)) {
        if (this.treeState.selected === this.tree.path || direct) {
          this.updateFold(!this.tree.status.open)
        } else {
          this.$emit('update', {treeState:{selected: this.tree.path}}, this.tree, this)
        }
      } else {
        this.$emit('update', {treeState:{selected: this.tree.path}}, this.tree, this)
      }
    },
    onupdate (change, value, origin) {
      this.$emit('update', change, value, origin)
    },
  },
}
</script>

<style lang="scss">
$pre: ac-table-tree-item;
.#{$pre}-projection {
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
  display: inline-flex;
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
