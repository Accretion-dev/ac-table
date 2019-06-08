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
          <ac-table :data="data" uid="test"/>
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

export default {
  name: 'app',
  data () {
    return {
      values:  [...Array(20).keys()].map(_ => ''),
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
