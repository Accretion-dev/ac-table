<template>
  <div :class="{
    [`${prefixCls}`]: true,
    [`${prefixCls}-not-show`]: !this.data.status.show,
    [`${this.prefixCls}-selected`]: selected}"
    @click="click"
  >
    <span v-if="icon">
      <icons :name="data.extra?'B_E':'blank'" size="0.9em"/>
      <span v-if="icon.array">
        <span class="ac-unselectable">[</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">]</span>
      </span>
      <span v-else>
        <span class="ac-unselectable">&nbsp;</span><icons :name="icon.type" size="0.9em"/><span class="ac-unselectable">&nbsp;</span>
      </span>
    </span>
    <b class="ac-unselectable">{{data.name}}:</b>
    <span class="ac-unselectable" v-if="!data.extra">{{data.path}}</span>
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
  },
  data () {
    return {
      prefixCls,
      typeMap,
      selected: false,
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
  }
}
</script>

<style lang="scss">
$pre: ac-tree-projection-item;
.#{$pre}:hover {
  background: #d8ffd7;
}
.#{$pre}-selected {
  background: #d8ffd775;
}
.#{$pre}-not-show {
  color: gainsboro;
}
</style>
