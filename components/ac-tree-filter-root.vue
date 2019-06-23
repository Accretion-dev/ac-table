<template>
  <span :class="`${prefixCls}`">
    <ac-input
      ref='wsBegin'
      v-if="struct.wsBegin !== null"
      v-model="struct.wsBegin"
      placeholder=""
      :border="false"
      :onfocus="testFocus('focus begin')"
      @cursorMove="cursorMove('wsBegin', $event)"
    />
    <struct-item
      ref='value'
      :tree="tree"
      parent="root"
      :value="struct.value"
      @cursorMove="cursorMove('value', $event)"
    />
    <ac-input
      ref='wsEnd'
      v-if="struct.wsEnd !== null"
      v-model="struct.wsEnd"
      placeholder=""
      :border="false"
      :onfocus="testFocus('focus end')"
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
      }
    }
  },
  computed: {
  },
  watch:{
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
    testFocus (value) {
      return () => {
        console.log(value)
      }
    },
    cursorMove (ref, data) {
      let {delta, deleting} = data
      if (ref === 'wsBegin') {
        if (delta>0) {
          this.$refs.value.cursorMove({delta, focus: true})
        }
      } else if (ref === 'value') {
        if (delta>0) {
          this.$refs.wsEnd.cursorMove({delta, focus: true, stay: true, deleting})
        } else {
          this.$refs.wsBegin.cursorMove({delta, focus: true, stay: true, deleting})
        }
      } else if (ref === 'wsEnd') {
        if (delta<0) {
          this.$refs.value.cursorMove({delta, focus: true, deleting})
        }
      }
    },
    updateStruct (string) {
      this.struct = this.parse(string)
    },
    parse (value) {
      return jsonFilterParser.parse(value)
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
