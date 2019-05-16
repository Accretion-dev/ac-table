const testConfig = require('./test-config.json')
// import backend from 'vue-selenium-unittest/backend.js'
import backend from 'vue-selenium-unittest/src/backend.js'
let normalKeys = '~!@#$%^&*()_+|}{POIUYTREWQASDFGHJKL:"?><MNBVCXZ"}'+"`1234567890-=\\][poiuytrewqasdfghjkl;'/.,mnbvcxz'"

let tests = {
  async all ({name, driver, Test, Key, By, until, Button, Origin}) {
    let keys = Object.keys(tests).filter(_ => _ !== 'all' && _ !== 'demo')
    for (let key of keys) {
      await tests[key]({name, driver, Test, Key, By, until, Button, Origin})
    }
  },
  demo: async ({name, driver, Test, Key, By, until, Button, Origin}) => {
    let data, keys, input
    let rootSelector = "#stretch"
    let interval = 0
    let app = await driver.findElement({id: 'app'})
    t = Test.block({name, rootSelector})
    await t.init()
    await t.initScroll()
    let root = await driver.findElement(By.css(rootSelector))
    let inputs = await root.findElements({tagName: 'input'})
    t.changeComment('test stretch (input and delete)', 500)
    input = inputs[0]
    await t.actions({actions: [], interval})

    t.changeComment('all done',500)
    t.changeComment('')
  },
}

let t = new backend({options: testConfig, tests})
t.init()
