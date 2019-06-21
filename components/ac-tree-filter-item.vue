<template>
  <div
    :draggable="!data.status.editing"
    :class="{
    [`${prefixCls}`]: true,
    [`${prefixCls}-selected`]: selected}"
    @click="click"
    @dblclick="dblclick"
    @dragover="dragover"
    @dragleave="dragleave"
    @drop="drop"
    @dragstart="dragstart"
    @dragend="dragend"
  >
    <div :class="`${this.prefixCls}-editing`" v-if="data.status.editing">
      <div :class="`${this.prefixCls}-form-line`">
        <b> name: </b>
        <ac-input
          ref="name"
          v-model="data.name"
          :focus-select-all-text="true"
          placeholder="name"
          @report="onreport('type')"
        />
      </div>
      <div :class="`${this.prefixCls}-form-line`">
        <b> type: </b>
        <ac-tree-filter-root
          ref="content"
          v-model="data.content"
          :focus-select-all-text="true"
          :tree="tree"
          placeholder="content"
          @report="onreport()"
        />
      </div>
    </div>
    <div :class="`${this.prefixCls}-display`" v-else>
      {{data}}
    </div>
  </div>
</template>

<script>
import icons from '../icons/icons.vue'
const prefixCls = 'ac-tree-filter-item'
import acTreeFilterRoot from './ac-tree-filter-root'

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
  name: 'ac-tree-filter-item',
  components: {acTreeFilterRoot},
  props: {
    tree: {type: Object, required: true},
    data: {type: Object, required: true},
    filterState: {type: Object, required: true},
    filter: {type: Array, required: true},
    index: {type: Number, default: -1},
    nodes: { type: Object },
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
      typeLists:['string','date','number','array','object'],
    }
  },
  watch:{
  },
  computed: {
  },
  created() {
    if (this.nodes) {
      this.nodes[this.data.uid] = this
    }
  },
  beforeDestroy() {
    if (this.nodes) {
      delete this.nodes[this.data.uid]
    }
  },
  mounted () {
  },
  methods: {
    onreport (value) {
      if (value==='report') {
        console.log('report')
      } else {
        this.$nextTick(() => {
          this.$refs[value].focus()
        })
      }
    },
    focus () {
      if (this.data.status.editing) {
        this.$refs.name.focus()
      } else {
        this.$el.focus()
      }
    },
    dblclick () {
      if (this.data.status.editing) return
      this.data.status.editing = !this.data.status.editing
      this.$forceUpdate()
      this.$nextTick(() => {
        this.focus()
      })
    },
    click (event) {
      if (!this.data.status.editing) {
        this.$emit('update', {changeSelect: this.data})
      }
    },
    select () {
      this.$emit('update', {changeSelect: this.data})
    },
    changeSelect (status) {
      this.selected = status
      if (status) {
        this.focus()
      }
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
$pre: ac-tree-filter-item;
.#{$pre}-projection {
  color: green;
  font-weight: bolder;
}
.#{$pre} {
  box-sizing: border-box;
}
.#{$pre}-editing {
  display: flex;
  flex-direction: column;
}
.#{$pre}-form-line {
  display: flex;
  align-items: center;
}
.#{$pre}-display:hover {
  background: #d8ffd7;
}
.#{$pre}-selected {
  background: #d8ffd775;
}
.#{$pre}-drag-upper {
  box-shadow: inset 0px 1px 0px 0px, 0px -1px 0px 0px;
}
.#{$pre}-drag-lower {
  box-shadow: inset 0px -1px 0px 0px, 0px 1px 0px 0px;
}
</style>
