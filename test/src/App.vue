<template>
  <div id="app">
    <h1> Test enviroment for ac-input</h1>
    <test-env>
      <test-block title="All tests" name="all">
        <ul>
          <li> <p class="test-title"> Test auto stretch: <test-button name="simple" :running="false"/> </p> </li>
        </ul>
      </test-block>
      <test-block title="Test simple input" name="simple" id="simple">
        <div>
          <ac-table :data="data" uid="test" :filter="testFilters"/>
        </div>
      </test-block>
    </test-env>
    <div style="height:1000px"> </div>
  </div>
</template>

<script>
const {DateTime, Duration} = require('luxon')
import data from '../data/999_2.json'
import {JsonAnalyser} from '../../utils/jsonAnalyser.js'

let demo = `
  @js: 'v.title.split().length<=2'   ||
  (title: white title: "white"   ||   title: 'Verde green')   ||
  title:    ||
  nonexists: 'true'   ||
  title: /white|(Verde green)/   ||
  (title|wlen: 3 || title|len: "<=5"  ||  title|wlen: ">=4 <=5")  ||
  title|js: "v.split().length < 10"  ||
  ex_date: "in:year:2018 >=01 <=02"  &&  ex_date: "2018-10"  ||
  ((aS|len: "<=2" && !(aN|len: ">3")) || (value: "<10000"  value: ">1000")) ||
  some random "string and blanks" ||
  array: [] ||
  array: [ ] ||
  object: {} ||
  object: { } ||
  aN: [
    @null|exists: true
  ] ||
  aN: [
    @array|len: "<3",
    @array>|every: ">0",
  ] ||
  aN: [
    @array|len: "<3",
    @array>: ">0"
  ] ||
  aN: [
    @array|len: "<3",
    @array>|any: ">0"
  ] ||
  aSNDAMO@array|len: ">5" ||
  aSNDAMO@array>|len: ">5" ||
  aSNDAMO@array>|or: [
    @number: ">0 <1000",
    {@date: "in:2018-01"},
  ] ||
  aSND|or: [
    @and: [
      @null|exists: true,
    ],
    {
      @and: [
        @array|js: "v.length<3",
        @array>@number: "<1000",
      ]
    }
  ]
`
let testFilters = [
  { name: "value", content: '123',
    uid: (new Date()).toISOString(), status: { editing: false, selected: false, use: true, }, },
  { name: "manyValue", content: 'abc 123 -12312 "213123 afads"',
    uid: (new Date()).toISOString(), status: { editing: false, selected: false, use: true, }, },
  { name: "single", content: 'title: /good/',
    uid: (new Date()).toISOString(), status: { editing: false, selected: false, use: true, }, },
  { name: "double", content: 'title: /good/ title: /bad/',
    uid: (new Date()).toISOString(), status: { editing: false, selected: false, use: true, }, },
  { name: "logical", content: 'title: /good/ int:">3" || title: /bad/ int:"<3" ',
    uid: (new Date()).toISOString(), status: { editing: false, selected: false, use: true, }, },
  { name: "nested", content: 'title: /good/ (int:">3" || title: /bad/) int:"<3" ',
    uid: (new Date()).toISOString(), status: { editing: false, selected: false, use: true, }, },
  { name: "demo", content: demo,
    uid: (new Date()).toISOString(), status: { editing: false, selected: false, use: true, }, },
]

export default {
  name: 'app',
  data () {
    return {
      values:  [...Array(20).keys()].map(_ => ''),
      testFilters,
      data
    }
  },
  computed: {
  },
  methods: {
  },
  created () {
  }
}
</script>

<style>
h1 {
  text-align: center;
}
.test-title {
  font-weight: bolder;
}
</style>
