<template>
  <div
    draggable="true"
    :class="{
    [`${prefixCls}`]: true,
    [`${prefixCls}-not-show`]: !this.data.status.show,
    [`${prefixCls}-selected`]: selected}"
    @click="click"
    @dragover="dragover"
    @dragleave="dragleave"
    @drop="drop"
    @dragstart="dragstart"
    @dragend="dragend"
  >
    <span v-if="icon">
      <icons :name="data.extraField?'B_E':'blank'" size="0.9em"/>
      <span v-if="icon.array">
        <span class="ac-unselectable">[</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">]</span>
      </span>
      <span v-else>
        <span class="ac-unselectable">&nbsp;</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">&nbsp;</span>
      </span>
    </span>
    <b class="ac-unselectable">{{data.name}}</b>
    <span class="ac-unselectable" v-if="!data.extraField">:{{data.path}}</span>
    <icons :style="{visibility: data.status.noFirstNewline?'visible':'hidden'}" name="no_pre_newline" size="0.9rem"/>
    <icons :style="{visibility: data.status.noNewline?'visible':'hidden'}" name="no_newline" size="0.9rem"/>
  </div>
</template>

<script>
import icons from '../icons/icons.vue'
const prefixCls = 'ac-tree-projection-item'
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
  name: 'ac-tree-projection-item',
  components: {icons},
  props: {
    data: {type: Object, required: true},
    projectionState: {type: Object, required: true},
    index: {type: Number, required: true},
  },
  data () {
    return {
      prefixCls,
      typeMap,
      selected: false,
      status: {
        dragover: 0,
        elDrag: null
      },
    }
  },
  watch:{
  },
  computed: {
    icon () {
      if (!this.data.type) { return null }
      if (this.data.arrayType) {
        return {
          type: 'B_'+typeMap[this.data.arrayType],
          array: true
        }
      } else {
        return {
          type: 'B_'+typeMap[this.data.type],
          array: false
        }
      }
    }
  },
  created() {
  },
  mounted () {
  },
  methods: {
    click (event) {
      this.$emit('update', {changeSelect: this.data})
    },
    changeSelect (status) {
      this.selected = status
    },
    changeShow () {
      this.data.status.show = !this.data.status.show
    },
    dragover (event) {
      event.preventDefault()
      let {y,height} = this.$el.getBoundingClientRect()
      let {y: mouseY} = event
      let status = y+height/2 > mouseY ? -1 : 1
      let lastState = this.status.dragover
      if (status !== this.status.dragover) {
        this.status.dragover = status
        if (lastState<0) {
          this.$el.classList.remove(`${prefixCls}-drag-upper`)
          this.$el.classList.add(`${prefixCls}-drag-lower`)
        } else if (lastState>0) {
          this.$el.classList.remove(`${prefixCls}-drag-lower`)
          this.$el.classList.add(`${prefixCls}-drag-upper`)
        } else {
          if (status>0) {
            this.$el.classList.add(`${prefixCls}-drag-lower`)
          } else {
            this.$el.classList.add(`${prefixCls}-drag-upper`)
          }
        }
      }
    },
    dragleave (event) {
      event.preventDefault()
      this.status.dragover = 0
      this.$el.classList.remove(`${prefixCls}-drag-upper`)
      this.$el.classList.remove(`${prefixCls}-drag-lower`)
    },
    drop (event) {
      event.preventDefault()
      this.status.dragover = 0
      this.$el.classList.remove(`${prefixCls}-drag-upper`)
      this.$el.classList.remove(`${prefixCls}-drag-lower`)
      let start = event.dataTransfer.getData("start")
      let end = this.index
      this.$emit('update', {reorder: {start, end}})
    },
    dragstart (event) {
      let {width} = this.$el.getBoundingClientRect()
      this.status.elDrag = this.$el.cloneNode(true)
      this.$el.style.setProperty('opacity', 0.4)
      this.status.elDrag.style.opacity = 0.4
      this.status.elDrag.style.width = width + 'px'
      this.status.elDrag.style.position = 'fixed'
      this.status.elDrag.style.left = '-' + (width*2+100) + 'px'
      document.body.appendChild(this.status.elDrag)
      event.dataTransfer.setDragImage(this.status.elDrag, 0, 0)
      event.dataTransfer.setData("start", this.index)
    },
    dragend (event) {
      this.$el.style.removeProperty('opacity')
      document.body.removeChild(this.status.elDrag)
    },
  }
}
</script>

<style lang="scss">
$pre: ac-tree-projection-item;
.#{$pre} {
  box-sizing: border-box;
}
.#{$pre}:hover {
  background: #d8ffd7;
}
.#{$pre}-selected {
  background: #d8ffd775;
}
.#{$pre}-not-show {
  color: gainsboro;
}
.#{$pre}-drag-upper {
  box-shadow: inset 0px 1px 0px 0px, 0px -1px 0px 0px;
}
.#{$pre}-drag-lower {
  box-shadow: inset 0px -1px 0px 0px, 0px 1px 0px 0px;
}
</style>
