<template>
  <div
    :draggable="!status.editing"
    :class="{
    [`${prefixCls}`]: true,
    [`${this.prefixCls}-selected`]: selected}"
    @click="click"
    @dragover="dragover"
    @dragleave="dragleave"
    @drop="drop"
    @dragstart="dragstart"
    @dragend="dragend"
  >
    <div :class="`${this.prefixCls}-editing`" v-if="status.editing">
      <div :class="`${this.prefixCls}-form-line`">
        <b> name: </b>
        <ac-input
          ref="name"
          v-model="data.name"
          :focus-select-all-text="true"
          placeholder="name"
          :reportDelay="200"
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
          :data="['string','date','number','array','object']"
          :reportDelay="200"
          @report="onreport(data.type==='array'?'arrayType':'js')"
        />
      </div>
      <div :class="`${this.prefixCls}-form-line`" v-if="data.type==='array'">
        <b> type: </b>
        <ac-input
          ref="type"
          v-model="data.arrayType"
          :focus-select-all-text="true"
          placeholder="arrayType"
          :data="['string','date','number','array','object']"
          :reportDelay="200"
        />
      </div>
      <div :class="`${this.prefixCls}-form-line`">
        <b> js: </b>
        <ac-input
          ref="js"
          v-model="data.js"
          :focus-select-all-text="true"
          placeholder="js"
          :reportDelay="200"
          @report="onreport('report')"
        />
      </div>
    </div>
    <div :class="`${this.prefixCls}-display`" v-else>
      <div>
        <span v-if="icon">
          <span v-if="icon.array">
            <span class="ac-unselectable">[</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">]</span>
          </span>
          <span v-else>
            <span class="ac-unselectable">&nbsp;</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">&nbsp;</span>
          </span>
        </span>
        <b class="ac-unselectable">{{data.path}}:</b>
        <icons :style="{visibility: data.status.noFirstNewline?'visible':'hidden'}" name="no_pre_newline" size="0.9rem"/>
        <icons :style="{visibility: data.status.noNewline?'visible':'hidden'}" name="no_newline" size="0.9rem"/>
      </div>
      <pre>{{data.js}}</pre>
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
  },
  data () {
    return {
      prefixCls,
      typeMap,
      selected: false,
      status: {
        editing: true,
        dragover: 0,
        elDrag: null
      },
    }
  },
  watch:{
    'data.name' (value) {
      data.path = value
    }
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
  },
  mounted () {
  },
  methods: {
    onreport (value) {
      if (value==='report') {
        let exists = this.extraField.find(_ => _.path = this.data.path)
        if (!exists) {
          console.log('report it')
          this.$emit('update', {add: this.data})
        }
      } else {
        this.$refs[value].focus()
      }
    },
    focus () {
      this.$refs.name.focus()
    },
    click (event) {
      if (!this.status.editing) {
        this.$emit('update', {changeSelect: this.data})
      }
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
$pre: ac-tree-extra-field-item;
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
.#{$pre}-display-selected {
  background: #d8ffd775;
}
.#{$pre}-drag-upper {
  box-shadow: inset 0px 1px 0px 0px, 0px -1px 0px 0px;
}
.#{$pre}-drag-lower {
  box-shadow: inset 0px -1px 0px 0px, 0px 1px 0px 0px;
}
</style>
