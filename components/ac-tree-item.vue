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
           v-for="(child,index) of tree.children"
          :keys="child.path"
          :index="index"
          :tree="child"
          :level="level+1"
          :treeState="treeState"
          @update="onupdate"
        />
      </div>
    </template>
    <template v-else>
      <template v-if="tree.children">  <!--not root but have children-->
        <div :class="`${prefixCls}-content`">
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
            <span :class="[`${prefixCls}-name`,'ac-unselectable']">{{tree.name}}</span>
            <pre ref="comments" :class="`${prefixCls}-comments`">{{comments}}</pre>
          </span>
        </div>
        <div ref="subtree" :class="`${prefixCls}-subtree`" v-show="tree.status.open">
          <div ref="vbar"
               :class="`${prefixCls}-vbar`"
               @mouseover="overBody"
               @mouseleave="leaveBody"
          />
          <ac-tree-item
             v-for="(child,index) of tree.children"
            :keys="child.path"
            :index="index"
            :tree="child"
            :level="level+1"
            :treeState="treeState"
            @update="onupdate"
          />
        </div>
      </template>
      <template v-else> <!--not root and not have children-->
        <div :class="`${prefixCls}-content`">
          <span :class="`${prefixCls}-title`" @mouseover="overBody" @mouseleave="leaveBody">
            <span v-if="icon.array">
              <span class="ac-unselectable">[</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">]</span>
            </span>
            <span v-else>
              <span class="ac-unselectable">&nbsp;</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">&nbsp;</span>
            </span>
            <span :class="[`${prefixCls}-name`,'ac-unselectable']">{{tree.name}}</span>
            <pre ref="comments" :class="`${prefixCls}-comments`">{{comments}}</pre>
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
    tree: { type: Object, default () { return {} } },
    level: { type: Number, default:0 },
    treeState: { type: Object, default () { return {} } },
  },
  data () {
    return {
      prefixCls,
      status: {
        folder: false,
        open: false
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
  },
  created () {
    this.nodes[this.tree.path] = this
  },
  methods: {
    updateFold (value) {
      console.log('update fold to', value)
      this.tree.status.open = value
    },
    updateSelected (value) {
      if (value) {
        this.$el.classList.add(`${prefixCls}-selected`)
      } else {
        this.$el.classList.remove(`${prefixCls}-selected`)
      }
    },
    overBody (event) {
      this.$el.style.setProperty('background', '#d8ffd7')
      this.$refs.comments.style.setProperty('display', 'unset')
      if (this.$refs.folder) {
        this.$refs.folder.style.setProperty('opacity', 1)
      }
      if (this.$refs.vbar) {
        this.$refs.vbar.style.setProperty('background', '#d8ffd7')
      }
    },
    leaveBody (event) {
      this.$el.style.removeProperty('background')
      this.$refs.comments.style.setProperty('display', 'none')
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
        this.tree.status.open = !this.tree.status.open
        this.updateFold(this.tree.status.open)
        this.$emit('update', {status:{open:this.tree.status.open}, treeState:{selected: this.tree.path}}, this.tree, this)
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
