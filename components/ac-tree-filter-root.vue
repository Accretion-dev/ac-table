<template>
  <span :class="`${prefixCls}`">
    <ac-input
      ref='wsBegin'
      v-if="struct.wsBegin !== null"
      v-model="struct.wsBegin"
      placeholder=""
      :border="false"
      :onfocus="testFocus('focus begin')"
      :oncreated="wsBeginCreated"
      @cursorMove="cursorMove('wsBegin', $event)"
    />
    <struct-item
      ref='value'
      :tree="tree"
      parent="root"
      :value="struct.value"
      @cursorMove="cursorMove('value', $event)"
      @ws="onws"
    />
    <ac-input
      ref='wsEnd'
      v-if="struct.wsEnd !== null"
      v-model="struct.wsEnd"
      placeholder=""
      :border="false"
      :onfocus="testFocus('focus end')"
      :oncreated="wsEndCreated"
      @cursorMove="cursorMove('wsEnd', $event)"
    />
  </span>
</template>

<script>
const prefixCls = 'ac-tree-filter-root'
import structItem from './ac-tree-filter-struct-item'
import jsonFilterParser from 'mongodb-simple-query-syntax/pegjs/json-filter.js'

function parser (value) {
}

export default {
  name: 'ac-tree-filter-root',
  components: {structItem},
  props: {
    value: {type: String, default: ''},
    tree:  {type: Object, required: true},
  },
  data () {
    return {
      prefixCls,
      struct: {
        type: 'root',
        wsBegin: "",
        wsEnd: "",
        value: {
          value: "",
          string: "",
        }
      }
    }
  },
  computed: {
  },
  watch:{
    'struct.wsBegin' (value) {
      console.log('struct.wsBegin:', value)
      this.struct.string = `${this.struct.wsBegin}${this.struct.value}${this.struct.wsEnd}`
    },
    'struct.wsEnd' (value) {
      console.log('struct.wsEnd:', value)
      this.struct.string = `${this.struct.wsBegin}${this.struct.value}${this.struct.wsEnd}`
    },
  },
  created() {
    this.updateStruct(this.value)
    this.$watch('value', this.updateStruct)
  },
  beforeDestroy() {
  },
  mounted () {
  },
  methods: {
    wsBeginCreated (self) {
      self.$watch('cursor',(cursor) => {
        if (self.cursor === self.value.length) {
          self.$emit('cursorMove', {
            delta:0, direction: 'right', stay: true, focus: true
          })
        }
      })
    },
    wsEndCreated (self) {
      self.$watch('cursor',(cursor) => {
        if (self.cursor === 0) {
          self.$emit('cursorMove', {
            delta:0, direction: 'left', stay: true, focus: true
          })
        }
      })
    },
    testFocus (value) {
      return () => {
        console.log(value)
      }
    },
    cursorMove (ref, data) {
      let {delta, deleting, direction} = data
      if (ref === 'wsBegin') {
        if (direction==='right'||delta>0) {
          this.$refs.value.cursorMove({delta, focus: true, stay: true, direction})
        }
      } else if (ref === 'value') {
        if (delta>0) {
          if (this.struct.wsEnd.length) {
            this.$refs.wsEnd.cursorMove({delta, focus: true, stay: true, deleting, direction})
          }
        } else {
          if (this.struct.wsBegin.length) {
            this.$refs.wsBegin.cursorMove({delta, focus: true, stay: true, deleting, direction})
          }
        }
      } else if (ref === 'wsEnd') {
        if (direction==='left'||delta<0) {
          this.$refs.value.cursorMove({delta, focus: true, deleting, stay: true, direction})
        }
      }
    },
    updateStruct (string) {
      let parsed = this.parse(string)
      this.$set(this, 'struct', parsed)
    },
    parse (value) {
      return jsonFilterParser.parse(value)
    },
    onws (data) {
      console.log('onws:', data)
      if (data.start) {
        this.$refs.wsBegin.insertString(data.start, 'end')
      }
    }
  }
}
</script>

<style lang="scss">
$pre: ac-tree-filter-root;
.#{$pre} {
  box-sizing: border-box;
  border-style: solid;
  border-width: thin;
  width: max-content;
  height: max-content;
  padding: 0;
  margin: 0;
  display: inline-flex;
}
</style>
