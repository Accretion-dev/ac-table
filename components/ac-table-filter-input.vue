<template>
  <span :class="`${prefixCls}`">
    <ac-input
      ref='value'
      v-model="innerValue"
      placeholder="filter"
      :data="inputData"
      @report="report"
    />
  </span>
</template>

<script>
const prefixCls = 'ac-table-filter-input'
import jsonFilterParser from 'mongodb-simple-query-syntax/pegjs/json-filter.js'
import _parser from 'mongodb-simple-query-syntax/json-filter.js'
const {parse: jsonParse, Parser: jsonParser} = _parser
import {JsonAnalyser} from '../utils/jsonAnalyser.js'

/* operators and special keyString
 * special keys: @js, @and, @or, @not
 * operators: js, len, wlen, exists, and, or
*/

export default {
  name: 'ac-table-filter-input',
  props: {
    value: {type: String, default: ''},
    tree:  {type: Object, required: true},
    rawdata:  {type: Array, required: true},
  },
  data () {
    return {
      prefixCls,
      innerValue: '',
      parser: null,
      treeAnalyser: null,
      inputData: {
        parser: null,
        data: []
      }
    }
  },
  computed: {
  },
  watch:{
    value (newValue, oldValue) {
      this.innerValue = newValue
      this.parser.parse(this.value)
    },
    innerValue (newValue, oldValue) {
      this.$emit('input', newValue)
    },
  },
  created() {
    this.inputData.parser = this.dataParser
    this.innerValue = this.value
    this.treeAnalyser = new JsonAnalyser({tree: this.tree, data: this.rawdata})
    this.parser = new jsonParser({treeAnalyser: this.treeAnalyser})
  },
  beforeDestroy() {
  },
  mounted () {
  },
  methods: {
    dataParser (value) {
      let parser = this.parser
      if (!value.length) { // value is empty, not use parser
        let result = parser.parse(value)
        return {
          cursor (cursor) {
            let result = parser.analysis(null)
            let {completeData, string, range, options, completeType} = result
            return {
              extract: string,
              range,
              completeData,
              options,
            }
          },
          complete (cursor, oldValue, newValue) {
            return {value: newValue, cursor:cursor-oldValue.length + newValue.length}
          },
          result,
        }
      } else { // use parser
        let result
        let error
        try {
          result = parser.parse(value)
        } catch (e) {
          error = e
          return {
            cursor (cursor) {
              return {extract: value, range: null}
            },
            complete (cursor, oldValue, newValue) {
              return {value: newValue, cursor:cursor-oldValue.length + newValue.length}
            },
            result:null,
            error,
          }
        }
        let state = {}
        return {
          cursor (cursor) {
            let result = parser.analysis(cursor)
            let {completeData, string, range, options, completeType} = result
            Object.assign(state, result)
            return {
              extract: string,
              range,
              completeData,
              options,
            }
          },
          complete (cursor, oldValue, newValue, deltaCursor) {
            let offset = deltaCursor === undefined ? 0 : deltaCursor
            let {start, end} = state.range
            let head = oldValue.slice(0,start)
            let tail = oldValue.slice(end)
            let newFullValue = `${head}${newValue}${tail}`
            let result = {value: newFullValue, cursor:start + newValue.length + offset}
            console.log('complete:', {cursor, newValue, deltaCursor, start, end, len:newValue.length})
            console.log('completeResult:', result)
            return result
          },
          result,
        }
      }
    },
    report (value) {
      this.$emit('report', value)
    },
    focus () {
      this.$refs.value.focus()
    },
  }
}
</script>

<style lang="scss">
$pre: ac-table-filter-input;
.#{$pre} {
  box-sizing: border-box;
  //border-style: solid;
  //border-width: thin;
  width: max-content;
  height: max-content;
  padding: 0;
  margin: 0;
  display: inline-flex;
}
</style>
