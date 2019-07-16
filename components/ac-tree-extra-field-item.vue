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
        <ac-input
          ref="type"
          v-model="data.type"
          :focus-select-all-text="true"
          placeholder="type"
          droptype="select"
          :data="typeLists"
          @report="onreport(data.type==='array'?'arrayType':'js')"
        />
      </div>
      <div :class="`${this.prefixCls}-form-line`" v-if="data.type==='array'">
        <b> arrayType: </b>
        <ac-input
          ref="arrayType"
          v-model="data.arrayType"
          :focus-select-all-text="true"
          placeholder="arrayType"
          :data="typeLists"
          @report="onreport('js')"
        />
      </div>
      <div :class="`${this.prefixCls}-form-line`">
        <b> js: </b>
        <ac-input
          ref="js"
          v-model="data.js"
          :focus-select-all-text="true"
          placeholder="js"
          @report="onreport('report')"
        />
      </div>
    </div>
    <div :class="`${this.prefixCls}-display`" v-else>
      <div :class="{[`${prefixCls}-projection`]: data.status.projection}">
        <span v-if="icon">
          <span v-if="icon.array">
            <span class="ac-unselectable">[</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">]</span>
          </span>
          <span v-else>
            <span class="ac-unselectable">&nbsp;</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">&nbsp;</span>
          </span>
        </span>
        <b class="ac-unselectable">{{data.name}}</b>
        <icons :style="{visibility: data.status.noFirstNewline?'visible':'hidden'}" name="no_pre_newline" size="0.9rem"/>
        <icons :style="{visibility: data.status.noNewline?'visible':'hidden'}" name="no_newline" size="0.9rem"/>
      </div>
      <div style="display:inline-flex;">
        <span class="ac-unselectable">&nbsp;&nbsp;</span>
        <pre style="margin: 0px;padding-left: 0.9em;">{{data.js}}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import icons from '../icons/icons.vue'
const prefixCls = 'ac-tree-extra-field-item'
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
  name: 'ac-tree-extra-field-item',
  components: {icons},
  props: {
    data: {type: Object, required: true},
    extraFieldState: {type: Object, required: true},
    extraField: {type: Array, required: true},
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
    'data.type' (value) {
      if (value !== 'array') {
        this.data.arrayType = ""
      }
    },
  },
  computed: {
    icon () {
      if (!this.data.type) {
        return {
          type: 'B_U',
          array: false
        }
      }
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
    if (this.nodes) {
      this.nodes[this.data.path] = this
    }
  },
  beforeDestroy() {
    if (this.nodes) {
      delete this.nodes[this.data.path]
    }
  },
  mounted () {
  },
  methods: {
    onreport (value) {
      if (value==='report') {
        if (this.index!==-1) { // modify exists
          this.data.status.editing = false
          this.$emit('update', {modify: this.data}, this)
        } else { // add new
          let exists = this.extraField.find(_ => _.name === this.data.name)
          if (!exists) {
            this.data.status.editing = false
            this.$emit('update', {add: this.data}, this)
          } else {
            this.$refs.name.setError('duplicated name')
          }
        }
      } else {
        this.$nextTick(() => {
          this.$refs[value].focus({ preventScroll: true })
        })
      }
    },
    updateNewline (status) {
      if (this.data.type==='object' || this.data.type==='array') {
        let pre = this.data.status.noFirstNewline
        let suf = this.data.status.noNewline
        if (!pre && !suf) {
          this.data.status.noNewline = true
        } else if (!pre && suf) {
          this.data.status.noNewline = true
          this.data.status.noFirstNewline = true
        } else if (pre && suf) {
          this.data.status.noFirstNewline = true
          this.data.status.noNewline = false
        } else {
          this.data.status.noNewline = false
          this.data.status.noFirstNewline = false
        }
      } else {
        this.data.status.noNewline = !this.data.status.noNewline
      }
      this.$emit('update', {status:{newline: {
        noNewline: this.data.status.noNewline,
        noFirstNewline: this.data.status.noFirstNewline,
      }}}, this)
    },
    focus () {
      if (this.data.status.editing) {
        this.$refs.name.focus({ preventScroll: true })
      } else {
        this.$el.focus({ preventScroll: true })
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
$pre: ac-tree-extra-field-item;
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
