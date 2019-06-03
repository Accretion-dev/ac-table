import test from 'ava'
import _ from 'lodash'
const fs = require('fs')
const {DateTime} = require('luxon')
console.log('new run')

import data from './data/999_2.json'
//import data_result from './data/999_2.result.json'
import {JsonAnalyser} from '../utils/jsonAnalyser.js'
import { diff, addedDiff, deletedDiff, updatedDiff, detailedDiff } from 'deep-object-diff'

function range(N) { // there is an unknown bug, i can not use the [...Array.keys(N)].map()
  let n = []
  for (let i=0; i<N;i++) {
    n.push(i)
  }
  return n
}
/*
  function clone(json) {
    return JSON.parse(JSON.stringify(json))
  }
*/
function clone(item) {
  if (!item) { return item; } // null, undefined values check

  var types = [ Number, String, Boolean ],
  result;

  // normalizing primitives if someone did new String('aaa'), or new Number('444');
  types.forEach(function(type) {
    if (item instanceof type) {
      result = type( item );
    }
  });

  if (typeof result == "undefined") {
    if (Object.prototype.toString.call( item ) === "[object Array]") {
      result = [];
      item.forEach(function(child, index, array) {
        result[index] = clone( child );
      });
    } else if (typeof item == "object") {
      // testing that this is DOM
      if (item.nodeType && typeof item.cloneNode == "function") {
        result = item.cloneNode( true );
      } else if (!item.prototype) { // check that this is a literal
        if (item instanceof Date) {
          result = new Date(item);
        } else {
          // it is an object literal
          result = {};
          for (var i in item) {
            result[i] = clone( item[i] );
          }
        }
      } else {
        // depending what you would like here,
        // just keep the reference, or create new object
        if (false && item.constructor) {
          // would not advice to do that, reason? Read below
          result = new item.constructor();
        } else {
          result = item;
        }
      }
    } else {
      result = item;
    }
  }

  return result;
}
function makeNestedJson(level, prefix, config) {
  if (level===null) return makeNestedJson(config.maxLevel, prefix, config)
  let result = {}
  let temp
  result.S = `${prefix?prefix+'.':''}S`
  result.N = (config.maxLevel - level + 1)*1
  result.D = (new Date()).toISOString()
  result.null = null
  if (level > 0) {
    result.O = makeNestedJson(level-1, `${prefix?prefix+'.':''}O`,config)
    let AS = range(config.A_string).map(_ => `${prefix?prefix+'.A':'A'}>string${_}`)
    let AN = range(config.A_number).map(_ => (config.maxLevel - level + 1) * 10)
    let AD = range(config.A_date).map(_ => (new Date()).toISOString())
    let Anull = range(config.A_date).map(_ => null)
    let AO = range(config.A_object).map(_ => makeNestedJson(level-1, `${prefix?prefix+'.A':'A'}>@obejct`, config))
    let AA0 = _.flatten([AS, AN, AD, Anull, clone(AO)])
    for (let depth of range(config.A_array_depth)) {
      AA0 = _.flatten([
        clone(AA0),
        range(config.A_array).map(_ => JSON.parse(JSON.stringify(AA0,
          (key, value) => {
            if (typeof(value) === 'string' && value.startsWith(`${prefix?prefix+'.A':'A'}>`)) {
              value = value.replace(`${prefix?prefix+'.A':'A'}>`, `${prefix?prefix+'.A':'A'}>>`)
            }
            if (typeof(value) === 'number') {
              value = value*100
            }
            return value
          }
        )))
      ])
    }
    result.A = AA0
  }
  return result
}
function doTest(object, prefix, vglobal) {
  const debugList = {
    //'A.O.A>': (data, paths, arrayDepth) => paths.length === 3 && Array.isArray(data),
    //'A>>.A>': (data, paths, arrayDepth) => paths.length === 2,
    //'A>>': (data, paths, arrayDepth) => paths.length === 2,
  }
  let type = typeof(object)
  if (type === 'object') {
    for (let name of Object.keys(object)) {
      doTest(object[name], `${prefix}${name}`, vglobal)
    }
  } else if (type === 'function') {
    let {t, example, analyser, get, dget} = vglobal
    let func = object
    let path = prefix
    let value
    if (Object.keys(debugList).includes(path)) {
      value = analyser.getValueByPath(example, path, debugList[path])
    } else {
      value = analyser.getValueByPath(example, path)
    }
    let good
    try {
      good = func(value)
    } catch {}
    t.true(good, `${path} failed`)
    if (!good) {
      vglobal.anybad = true
      console.log('bad path:', path, value)
      debugger
    } else {
      console.log('good path:', path)
    }
  }
}
function arrayize(object, prefix) {
  let result = {}
  let type = typeof(object)
  if (type === 'object') {
    for (let name of Object.keys(object)) {
      result[name] = arrayize(object[name], `${prefix}${name}`)
    }
    return result
  } else if (type === 'function') {
    if (object === isUndefined) {
      return isUndefined
    } else {
      return _ => _.every(__ => object(__))
    }
  }
}
function isUndefined(_) {
  return _ === undefined
}
function isNull(_) {
  return _ === null
}

test('test single json explore syntax', t => {
  let example
  let configs = {
    maxLevel: 4,
    A_string: 1,
    A_number: 1,
    A_date: 1,
    A_null: 1,
    A_array: 1,
    A_object: 2,
    A_array_depth: 3,
  }
  let array_length = configs.A_string + configs.A_number + configs.A_date + configs.A_null + configs.A_array + configs.A_object
  try {
    let str = fs.readFileSync('./data/example.json')
    example = JSON.parse(str)
    console.log('use old example')
  } catch (e) {
    example = makeNestedJson(null, '', configs)
    let str = JSON.stringify(example)
    fs.writeFileSync('./data/example.json', str)
    console.log('gen new example')
  }
  let analyser = new JsonAnalyser()
  let get = _ => analyser.getValueByPath(example,_)
  let dget = _ => analyser.getValueByPath(example,_,true)
  let simpleTests, arraySimpleTest, arrayOfObjectTest, arrayTests, objectTests, arrayObjectTest, complexTests

  simpleTests = {
    'S': {
      '': _ => typeof(_) === 'string',
      '@string': _ => typeof(_) === 'string',
      '@number': isUndefined,
      '@date': isUndefined,
      '@array': isUndefined,
      '@object': isUndefined,
      '@null': isUndefined,
      '>': isUndefined,
      '.nonExist': isUndefined,
    },
    'N': {
      '': _ => typeof(_) === 'number',
      '@string': isUndefined,
      '@number': _ => typeof(_) === 'number',
      '@date': isUndefined,
      '@array': isUndefined,
      '@object': isUndefined,
      '@null': isUndefined,
      '>': isUndefined,
      '.nonExist': isUndefined,
    },
    'D': {
      '': _ => typeof(_) === 'string' && _.includes('T'),
      '@string': isUndefined,
      '@number': isUndefined,
      '@date': _ => typeof(_) === 'string' && _.includes('T'),
      '@array': isUndefined,
      '@object': isUndefined,
      '@null': isUndefined,
      '>': isUndefined,
      '.nonExist': isUndefined,
    },
    'null': {
      '': _ => _ === null,
      '@string': isUndefined,
      '@number': isUndefined,
      '@date': isUndefined,
      '@array': isUndefined,
      '@object': isUndefined,
      '@null': _ => _=== null,
      '>': isUndefined,
      '.nonExist': isUndefined,
    },
    'O': {
      '': _ => typeof(_)==='object'&&!Array.isArray(_)&&_!==null,
      '@string': isUndefined,
      '@number': isUndefined,
      '@date': isUndefined,
      '@array': isUndefined,
      '@object': _ => typeof(_)==='object'&&!Array.isArray(_)&&_!==null,
      '@null': isUndefined,
      '>': isUndefined,
      '.nonExist': isUndefined,
    },
  }
  arraySimpleTest = arrayize(simpleTests, '')
  arrayOfObjectTest = {
    '.': {
      ...arraySimpleTest,
    }
  }
  objectTests = {
    '': {
      '': _ => typeof(_) === 'object',
      '@string': isUndefined,
      '@number': isUndefined,
      '@date': isUndefined,
      '@array': isUndefined,
      '@object': _ => typeof(_) === 'object',
      '@null': isUndefined,
      '>': isUndefined,
      '.nonExist': isUndefined,
    },
    ".S": simpleTests.S,
    ".N": simpleTests.N,
    ".D": simpleTests.D,
    ".null": simpleTests.null,
  }
  objectTests['.O'] = clone(objectTests)
  let ns = configs.A_string
  let nn = configs.A_number
  let nd = configs.A_date
  let nu = configs.A_null
  let no = configs.A_object
  let na = configs.A_array
  let ad = configs.A_array_depth

  let bl = ns+nn+nd+nu+no
  complexTests = {
    "A": {
      '': {
        '': _ => Array.isArray(_) && _.length === bl+ad,
        '@string': isUndefined,
        '@number': isUndefined,
        '@date': isUndefined,
        '@array': _ => Array.isArray(_) && _.length === bl+ad,
        '@object': isUndefined,
        '@null': isUndefined,
        '.nonExist': isUndefined,
      },
      ".": { // length is length of >@object
        'S': {
          '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no,
          '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no,
          '@number': isUndefined,
          '@date': isUndefined,
          '@array': isUndefined,
          '@object': isUndefined,
          '@null': isUndefined,
          '>': isUndefined,
          '.nonExist': isUndefined,
        },
        'N': {
          '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no,
          '@string': isUndefined,
          '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no,
          '@date': isUndefined,
          '@array': isUndefined,
          '@object': isUndefined,
          '@null': isUndefined,
          '>': isUndefined,
          '.nonExist': isUndefined,
        },
        'D': {
          '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no,
          '@string': isUndefined,
          '@number': isUndefined,
          '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no,
          '@array': isUndefined,
          '@object': isUndefined,
          '@null': isUndefined,
          '>': isUndefined,
          '.nonExist': isUndefined,
        },
        'null': {
          '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no,
          '@string': isUndefined,
          '@number': isUndefined,
          '@date': isUndefined,
          '@array': isUndefined,
          '@object': isUndefined,
          '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no,
          '>': isUndefined,
          '.nonExist': isUndefined,
        },
        'O': {
          '': {
            '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === no,
            '@string': isUndefined,
            '@number': isUndefined,
            '@date': isUndefined,
            '@array': isUndefined,
            '@object': isUndefined,
            '@object': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === no,
            '@null': isUndefined,
            '>': isUndefined,
            '.nonExist': isUndefined,
          },
          '.': {
            'S': {
              '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no,
              '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no,
              '@number': isUndefined,
              '@date': isUndefined,
              '@array': isUndefined,
              '@object': isUndefined,
              '@null': isUndefined,
              '>': isUndefined,
              '.nonExist': isUndefined,
            },
            'N': {
              '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no,
              '@string': isUndefined,
              '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no,
              '@date': isUndefined,
              '@array': isUndefined,
              '@object': isUndefined,
              '@null': isUndefined,
              '>': isUndefined,
              '.nonExist': isUndefined,
            },
            'D': {
              '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no,
              '@string': isUndefined,
              '@number': isUndefined,
              '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no,
              '@array': isUndefined,
              '@object': isUndefined,
              '@null': isUndefined,
              '>': isUndefined,
              '.nonExist': isUndefined,
            },
            'null': {
              '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no,
              '@string': isUndefined,
              '@number': isUndefined,
              '@date': isUndefined,
              '@array': isUndefined,
              '@object': isUndefined,
              '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no,
              '>': isUndefined,
              '.nonExist': isUndefined,
            },
            'O': {
              '': {
                '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === no,
                '@string': isUndefined,
                '@number': isUndefined,
                '@date': isUndefined,
                '@array': isUndefined,
                '@object': isUndefined,
                '@object': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === no,
                '@null': isUndefined,
                '>': isUndefined,
                '.nonExist': isUndefined,
              },
              '.': {
                'S': {
                  '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no,
                  '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no,
                  '@number': isUndefined,
                  '@date': isUndefined,
                  '@array': isUndefined,
                  '@object': isUndefined,
                  '@null': isUndefined,
                  '>': isUndefined,
                  '.nonExist': isUndefined,
                },
                'N': {
                  '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no,
                  '@string': isUndefined,
                  '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no,
                  '@date': isUndefined,
                  '@array': isUndefined,
                  '@object': isUndefined,
                  '@null': isUndefined,
                  '>': isUndefined,
                  '.nonExist': isUndefined,
                },
                'D': {
                  '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no,
                  '@string': isUndefined,
                  '@number': isUndefined,
                  '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no,
                  '@array': isUndefined,
                  '@object': isUndefined,
                  '@null': isUndefined,
                  '>': isUndefined,
                  '.nonExist': isUndefined,
                },
                'null': {
                  '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no,
                  '@string': isUndefined,
                  '@number': isUndefined,
                  '@date': isUndefined,
                  '@array': isUndefined,
                  '@object': isUndefined,
                  '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no,
                  '>': isUndefined,
                  '.nonExist': isUndefined,
                },
                'O': {
                  '': {
                    '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === no,
                    '@string': isUndefined,
                    '@number': isUndefined,
                    '@date': isUndefined,
                    '@array': isUndefined,
                    '@object': isUndefined,
                    '@object': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === no,
                    '@null': isUndefined,
                    '>': isUndefined,
                    '.nonExist': isUndefined,
                  },
                  '.': {
                    'S': {
                      '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no,
                      '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no,
                      '@number': isUndefined,
                      '@date': isUndefined,
                      '@array': isUndefined,
                      '@object': isUndefined,
                      '@null': isUndefined,
                      '>': isUndefined,
                      '.nonExist': isUndefined,
                    },
                    'N': {
                      '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no,
                      '@string': isUndefined,
                      '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no,
                      '@date': isUndefined,
                      '@array': isUndefined,
                      '@object': isUndefined,
                      '@null': isUndefined,
                      '>': isUndefined,
                      '.nonExist': isUndefined,
                    },
                    'D': {
                      '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no,
                      '@string': isUndefined,
                      '@number': isUndefined,
                      '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no,
                      '@array': isUndefined,
                      '@object': isUndefined,
                      '@null': isUndefined,
                      '>': isUndefined,
                      '.nonExist': isUndefined,
                    },
                    'null': {
                      '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no,
                      '@string': isUndefined,
                      '@number': isUndefined,
                      '@date': isUndefined,
                      '@array': isUndefined,
                      '@object': isUndefined,
                      '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no,
                      '>': isUndefined,
                      '.nonExist': isUndefined,
                    },
                    'O': { '': isUndefined },
                  }
                },
              }
            },
          }
        },
      },
      '>': {
        '': {
          '': _ => Array.isArray(_) && _.length === bl+3, // 9
          '@string': _ => Array.isArray(_) && _.length === ns,
          '@number': _ => Array.isArray(_) && _.length === nn,
          '@date': _ => Array.isArray(_) && _.length === nd,
          '@null': _ => Array.isArray(_) && _.length === nu,
          '@array': { // root length
            '': _ => Array.isArray(_) && _.length === ad, //3
            '>': { }
          },
          '@object': { // root length
            '': _ => Array.isArray(_) && _.length === no, //2
            '.': { },
          },
        },
        ".": { },
        '>': {
          '': {
            '': Array.isArray(_) && _.length === (2*bl+ad-1)*ad/2, // 21
            '@string': _ => Array.isArray(_) && _.length === ns*ad,
            '@number': _ => Array.isArray(_) && _.length === nn*ad,
            '@date': _ => Array.isArray(_) && _.length === nd*ad,
            '@null': _ => Array.isArray(_) && _.length === nu*ad,
            '@array': { // count length
              '': _ => Array.isArray(_) && _.length === (ad-1)*ad/2, // 3
              '>': { }
            },
            '@object': { // length is no*>@array
              '': _ => Array.isArray(_) && _.length === no*ad, // 6
              '.': {},
            },
          },
          '.': {  // length is length of >>@object
            'S': {
              '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no*ad,
              '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no*ad,
              '@number': isUndefined,
              '@date': isUndefined,
              '@array': isUndefined,
              '@object': isUndefined,
              '@null': isUndefined,
              '>': isUndefined,
              '.nonExist': isUndefined,
            },
            'N': {
              '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no*ad,
              '@string': isUndefined,
              '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no*ad,
              '@date': isUndefined,
              '@array': isUndefined,
              '@object': isUndefined,
              '@null': isUndefined,
              '>': isUndefined,
              '.nonExist': isUndefined,
            },
            'D': {
              '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no*ad,
              '@string': isUndefined,
              '@number': isUndefined,
              '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no*ad,
              '@array': isUndefined,
              '@object': isUndefined,
              '@null': isUndefined,
              '>': isUndefined,
              '.nonExist': isUndefined,
            },
            'null': {
              '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no*ad,
              '@string': isUndefined,
              '@number': isUndefined,
              '@date': isUndefined,
              '@array': isUndefined,
              '@object': isUndefined,
              '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no*ad,
              '>': isUndefined,
              '.nonExist': isUndefined,
            },
            'O': {
              '': {
                '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === no*ad,
                '@string': isUndefined,
                '@number': isUndefined,
                '@date': isUndefined,
                '@array': isUndefined,
                '@object': isUndefined,
                '@object': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === no*ad,
                '@null': isUndefined,
                '>': isUndefined,
                '.nonExist': isUndefined,
              },
              '.': {
                'S': {
                  '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 6,
                  '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 6,
                  '@number': isUndefined,
                  '@date': isUndefined,
                  '@array': isUndefined,
                  '@object': isUndefined,
                  '@null': isUndefined,
                  '>': isUndefined,
                  '.nonExist': isUndefined,
                },
                'N': {
                  '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 6,
                  '@string': isUndefined,
                  '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 6,
                  '@date': isUndefined,
                  '@array': isUndefined,
                  '@object': isUndefined,
                  '@null': isUndefined,
                  '>': isUndefined,
                  '.nonExist': isUndefined,
                },
                'D': {
                  '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 6,
                  '@string': isUndefined,
                  '@number': isUndefined,
                  '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 6,
                  '@array': isUndefined,
                  '@object': isUndefined,
                  '@null': isUndefined,
                  '>': isUndefined,
                  '.nonExist': isUndefined,
                },
                'null': {
                  '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 6,
                  '@string': isUndefined,
                  '@number': isUndefined,
                  '@date': isUndefined,
                  '@array': isUndefined,
                  '@object': isUndefined,
                  '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 6,
                  '>': isUndefined,
                  '.nonExist': isUndefined,
                },
                'O': {
                  '': {
                    '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === 6,
                    '@string': isUndefined,
                    '@number': isUndefined,
                    '@date': isUndefined,
                    '@array': isUndefined,
                    '@object': isUndefined,
                    '@object': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === 6,
                    '@null': isUndefined,
                    '>': isUndefined,
                    '.nonExist': isUndefined,
                  },
                  '.': {
                    'S': {
                      '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 6,
                      '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 6,
                      '@number': isUndefined,
                      '@date': isUndefined,
                      '@array': isUndefined,
                      '@object': isUndefined,
                      '@null': isUndefined,
                      '>': isUndefined,
                      '.nonExist': isUndefined,
                    },
                    'N': {
                      '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 6,
                      '@string': isUndefined,
                      '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 6,
                      '@date': isUndefined,
                      '@array': isUndefined,
                      '@object': isUndefined,
                      '@null': isUndefined,
                      '>': isUndefined,
                      '.nonExist': isUndefined,
                    },
                    'D': {
                      '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 6,
                      '@string': isUndefined,
                      '@number': isUndefined,
                      '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 6,
                      '@array': isUndefined,
                      '@object': isUndefined,
                      '@null': isUndefined,
                      '>': isUndefined,
                      '.nonExist': isUndefined,
                    },
                    'null': {
                      '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 6,
                      '@string': isUndefined,
                      '@number': isUndefined,
                      '@date': isUndefined,
                      '@array': isUndefined,
                      '@object': isUndefined,
                      '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 6,
                      '>': isUndefined,
                      '.nonExist': isUndefined,
                    },
                    'O': {
                      '': {
                        '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === 6,
                        '@string': isUndefined,
                        '@number': isUndefined,
                        '@date': isUndefined,
                        '@array': isUndefined,
                        '@object': isUndefined,
                        '@object': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === 6,
                        '@null': isUndefined,
                        '>': isUndefined,
                        '.nonExist': isUndefined,
                      },
                      '.': {
                        'S': {
                          '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 6,
                          '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 6,
                          '@number': isUndefined,
                          '@date': isUndefined,
                          '@array': isUndefined,
                          '@object': isUndefined,
                          '@null': isUndefined,
                          '>': isUndefined,
                          '.nonExist': isUndefined,
                        },
                        'N': {
                          '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 6,
                          '@string': isUndefined,
                          '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 6,
                          '@date': isUndefined,
                          '@array': isUndefined,
                          '@object': isUndefined,
                          '@null': isUndefined,
                          '>': isUndefined,
                          '.nonExist': isUndefined,
                        },
                        'D': {
                          '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 6,
                          '@string': isUndefined,
                          '@number': isUndefined,
                          '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 6,
                          '@array': isUndefined,
                          '@object': isUndefined,
                          '@null': isUndefined,
                          '>': isUndefined,
                          '.nonExist': isUndefined,
                        },
                        'null': {
                          '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 6,
                          '@string': isUndefined,
                          '@number': isUndefined,
                          '@date': isUndefined,
                          '@array': isUndefined,
                          '@object': isUndefined,
                          '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 6,
                          '>': isUndefined,
                          '.nonExist': isUndefined,
                        },
                        'O': { '': isUndefined },
                      }
                    },
                  }
                },
              }
            },
          },
          '>': {
            '': {
              '': Array.isArray(_) && _.length === (3*bl) + 1,
              '@string': _ => Array.isArray(_) && _.length === ns*ad,
              '@number': _ => Array.isArray(_) && _.length === nn*ad,
              '@date': _ => Array.isArray(_) && _.length === nd*ad,
              '@null': _ => Array.isArray(_) && _.length === nu*ad,
              '@array': { // count length
                '': _ => Array.isArray(_) && _.length === 1,
                '>': { }
              },
              '@object': { // clength is no*>>@array
                '': _ => Array.isArray(_) && _.length === no*3, //6
                '.': {},
              },
            },
            '.': {  // length is length of >>>@object
              'S': {
                '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no*3,
                '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no*3,
                '@number': isUndefined,
                '@date': isUndefined,
                '@array': isUndefined,
                '@object': isUndefined,
                '@null': isUndefined,
                '>': isUndefined,
                '.nonExist': isUndefined,
              },
              'N': {
                '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no*3,
                '@string': isUndefined,
                '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no*3,
                '@date': isUndefined,
                '@array': isUndefined,
                '@object': isUndefined,
                '@null': isUndefined,
                '>': isUndefined,
                '.nonExist': isUndefined,
              },
              'D': {
                '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no*3,
                '@string': isUndefined,
                '@number': isUndefined,
                '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no*3,
                '@array': isUndefined,
                '@object': isUndefined,
                '@null': isUndefined,
                '>': isUndefined,
                '.nonExist': isUndefined,
              },
              'null': {
                '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no*3,
                '@string': isUndefined,
                '@number': isUndefined,
                '@date': isUndefined,
                '@array': isUndefined,
                '@object': isUndefined,
                '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no*3,
                '>': isUndefined,
                '.nonExist': isUndefined,
              },
              'O': {
                '': {
                  '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === no*3,
                  '@string': isUndefined,
                  '@number': isUndefined,
                  '@date': isUndefined,
                  '@array': isUndefined,
                  '@object': isUndefined,
                  '@object': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === no*3,
                  '@null': isUndefined,
                  '>': isUndefined,
                  '.nonExist': isUndefined,
                },
                '.': {
                  'S': {
                    '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 6,
                    '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 6,
                    '@number': isUndefined,
                    '@date': isUndefined,
                    '@array': isUndefined,
                    '@object': isUndefined,
                    '@null': isUndefined,
                    '>': isUndefined,
                    '.nonExist': isUndefined,
                  },
                  'N': {
                    '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 6,
                    '@string': isUndefined,
                    '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 6,
                    '@date': isUndefined,
                    '@array': isUndefined,
                    '@object': isUndefined,
                    '@null': isUndefined,
                    '>': isUndefined,
                    '.nonExist': isUndefined,
                  },
                  'D': {
                    '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 6,
                    '@string': isUndefined,
                    '@number': isUndefined,
                    '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 6,
                    '@array': isUndefined,
                    '@object': isUndefined,
                    '@null': isUndefined,
                    '>': isUndefined,
                    '.nonExist': isUndefined,
                  },
                  'null': {
                    '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 6,
                    '@string': isUndefined,
                    '@number': isUndefined,
                    '@date': isUndefined,
                    '@array': isUndefined,
                    '@object': isUndefined,
                    '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 6,
                    '>': isUndefined,
                    '.nonExist': isUndefined,
                  },
                  'O': {
                    '': {
                      '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === 6,
                      '@string': isUndefined,
                      '@number': isUndefined,
                      '@date': isUndefined,
                      '@array': isUndefined,
                      '@object': isUndefined,
                      '@object': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === 6,
                      '@null': isUndefined,
                      '>': isUndefined,
                      '.nonExist': isUndefined,
                    },
                    '.': {
                      'S': {
                        '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 6,
                        '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 6,
                        '@number': isUndefined,
                        '@date': isUndefined,
                        '@array': isUndefined,
                        '@object': isUndefined,
                        '@null': isUndefined,
                        '>': isUndefined,
                        '.nonExist': isUndefined,
                      },
                      'N': {
                        '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 6,
                        '@string': isUndefined,
                        '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 6,
                        '@date': isUndefined,
                        '@array': isUndefined,
                        '@object': isUndefined,
                        '@null': isUndefined,
                        '>': isUndefined,
                        '.nonExist': isUndefined,
                      },
                      'D': {
                        '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 6,
                        '@string': isUndefined,
                        '@number': isUndefined,
                        '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 6,
                        '@array': isUndefined,
                        '@object': isUndefined,
                        '@null': isUndefined,
                        '>': isUndefined,
                        '.nonExist': isUndefined,
                      },
                      'null': {
                        '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 6,
                        '@string': isUndefined,
                        '@number': isUndefined,
                        '@date': isUndefined,
                        '@array': isUndefined,
                        '@object': isUndefined,
                        '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 6,
                        '>': isUndefined,
                        '.nonExist': isUndefined,
                      },
                      'O': {
                        '': {
                          '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === 6,
                          '@string': isUndefined,
                          '@number': isUndefined,
                          '@date': isUndefined,
                          '@array': isUndefined,
                          '@object': isUndefined,
                          '@object': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === 6,
                          '@null': isUndefined,
                          '>': isUndefined,
                          '.nonExist': isUndefined,
                        },
                        '.': {
                          'S': {
                            '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 6,
                            '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 6,
                            '@number': isUndefined,
                            '@date': isUndefined,
                            '@array': isUndefined,
                            '@object': isUndefined,
                            '@null': isUndefined,
                            '>': isUndefined,
                            '.nonExist': isUndefined,
                          },
                          'N': {
                            '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 6,
                            '@string': isUndefined,
                            '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 6,
                            '@date': isUndefined,
                            '@array': isUndefined,
                            '@object': isUndefined,
                            '@null': isUndefined,
                            '>': isUndefined,
                            '.nonExist': isUndefined,
                          },
                          'D': {
                            '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 6,
                            '@string': isUndefined,
                            '@number': isUndefined,
                            '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 6,
                            '@array': isUndefined,
                            '@object': isUndefined,
                            '@null': isUndefined,
                            '>': isUndefined,
                            '.nonExist': isUndefined,
                          },
                          'null': {
                            '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 6,
                            '@string': isUndefined,
                            '@number': isUndefined,
                            '@date': isUndefined,
                            '@array': isUndefined,
                            '@object': isUndefined,
                            '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 6,
                            '>': isUndefined,
                            '.nonExist': isUndefined,
                          },
                          'O': { '': isUndefined },
                        }
                      },
                    }
                  },
                }
              },
            },
            '>': {
              '': {
                '': Array.isArray(_) && _.length === bl,
                '@string': _ => Array.isArray(_) && _.length === ns,
                '@number': _ => Array.isArray(_) && _.length === nn,
                '@date': _ => Array.isArray(_) && _.length === nd,
                '@null': _ => Array.isArray(_) && _.length === nu,
                '@array': { // count length
                  '': _ => isUndefined,
                  '>': { }
                },
                '@object': { // clength is no*>>@array
                  '': _ => Array.isArray(_) && _.length === no, //2
                  '.': {},
                },
              },
              '.': {  // length is length of >>>>@object
                'S': {
                  '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no,
                  '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === no,
                  '@number': isUndefined,
                  '@date': isUndefined,
                  '@array': isUndefined,
                  '@object': isUndefined,
                  '@null': isUndefined,
                  '>': isUndefined,
                  '.nonExist': isUndefined,
                },
                'N': {
                  '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no,
                  '@string': isUndefined,
                  '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === no,
                  '@date': isUndefined,
                  '@array': isUndefined,
                  '@object': isUndefined,
                  '@null': isUndefined,
                  '>': isUndefined,
                  '.nonExist': isUndefined,
                },
                'D': {
                  '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no,
                  '@string': isUndefined,
                  '@number': isUndefined,
                  '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === no,
                  '@array': isUndefined,
                  '@object': isUndefined,
                  '@null': isUndefined,
                  '>': isUndefined,
                  '.nonExist': isUndefined,
                },
                'null': {
                  '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no,
                  '@string': isUndefined,
                  '@number': isUndefined,
                  '@date': isUndefined,
                  '@array': isUndefined,
                  '@object': isUndefined,
                  '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === no,
                  '>': isUndefined,
                  '.nonExist': isUndefined,
                },
                'O': {
                  '': {
                    '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === no,
                    '@string': isUndefined,
                    '@number': isUndefined,
                    '@date': isUndefined,
                    '@array': isUndefined,
                    '@object': isUndefined,
                    '@object': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === no,
                    '@null': isUndefined,
                    '>': isUndefined,
                    '.nonExist': isUndefined,
                  },
                  '.': {
                    'S': {
                      '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 2,
                      '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 2,
                      '@number': isUndefined,
                      '@date': isUndefined,
                      '@array': isUndefined,
                      '@object': isUndefined,
                      '@null': isUndefined,
                      '>': isUndefined,
                      '.nonExist': isUndefined,
                    },
                    'N': {
                      '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 2,
                      '@string': isUndefined,
                      '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 2,
                      '@date': isUndefined,
                      '@array': isUndefined,
                      '@object': isUndefined,
                      '@null': isUndefined,
                      '>': isUndefined,
                      '.nonExist': isUndefined,
                    },
                    'D': {
                      '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 2,
                      '@string': isUndefined,
                      '@number': isUndefined,
                      '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 2,
                      '@array': isUndefined,
                      '@object': isUndefined,
                      '@null': isUndefined,
                      '>': isUndefined,
                      '.nonExist': isUndefined,
                    },
                    'null': {
                      '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 2,
                      '@string': isUndefined,
                      '@number': isUndefined,
                      '@date': isUndefined,
                      '@array': isUndefined,
                      '@object': isUndefined,
                      '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 2,
                      '>': isUndefined,
                      '.nonExist': isUndefined,
                    },
                    'O': {
                      '': {
                        '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === 2,
                        '@string': isUndefined,
                        '@number': isUndefined,
                        '@date': isUndefined,
                        '@array': isUndefined,
                        '@object': isUndefined,
                        '@object': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === 2,
                        '@null': isUndefined,
                        '>': isUndefined,
                        '.nonExist': isUndefined,
                      },
                      '.': {
                        'S': {
                          '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 2,
                          '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 2,
                          '@number': isUndefined,
                          '@date': isUndefined,
                          '@array': isUndefined,
                          '@object': isUndefined,
                          '@null': isUndefined,
                          '>': isUndefined,
                          '.nonExist': isUndefined,
                        },
                        'N': {
                          '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 2,
                          '@string': isUndefined,
                          '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 2,
                          '@date': isUndefined,
                          '@array': isUndefined,
                          '@object': isUndefined,
                          '@null': isUndefined,
                          '>': isUndefined,
                          '.nonExist': isUndefined,
                        },
                        'D': {
                          '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 2,
                          '@string': isUndefined,
                          '@number': isUndefined,
                          '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 2,
                          '@array': isUndefined,
                          '@object': isUndefined,
                          '@null': isUndefined,
                          '>': isUndefined,
                          '.nonExist': isUndefined,
                        },
                        'null': {
                          '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 2,
                          '@string': isUndefined,
                          '@number': isUndefined,
                          '@date': isUndefined,
                          '@array': isUndefined,
                          '@object': isUndefined,
                          '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 2,
                          '>': isUndefined,
                          '.nonExist': isUndefined,
                        },
                        'O': {
                          '': {
                            '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === 2,
                            '@string': isUndefined,
                            '@number': isUndefined,
                            '@date': isUndefined,
                            '@array': isUndefined,
                            '@object': isUndefined,
                            '@object': _ => Array.isArray(_) && _.every(__ => typeof(__)==='object'&&!Array.isArray(__)&&__!==null,) && _.length === 2,
                            '@null': isUndefined,
                            '>': isUndefined,
                            '.nonExist': isUndefined,
                          },
                          '.': {
                            'S': {
                              '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 2,
                              '@string': _ => Array.isArray(_) && _.every(__ => typeof(__)==='string') && _.length === 2,
                              '@number': isUndefined,
                              '@date': isUndefined,
                              '@array': isUndefined,
                              '@object': isUndefined,
                              '@null': isUndefined,
                              '>': isUndefined,
                              '.nonExist': isUndefined,
                            },
                            'N': {
                              '': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 2,
                              '@string': isUndefined,
                              '@number': _ => Array.isArray(_) && _.every(__ => typeof(__)==='number') && _.length === 2,
                              '@date': isUndefined,
                              '@array': isUndefined,
                              '@object': isUndefined,
                              '@null': isUndefined,
                              '>': isUndefined,
                              '.nonExist': isUndefined,
                            },
                            'D': {
                              '': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 2,
                              '@string': isUndefined,
                              '@number': isUndefined,
                              '@date': _ => Array.isArray(_) && _.every(__ => typeof(__) === 'string' && __.includes('T')) && _.length === 2,
                              '@array': isUndefined,
                              '@object': isUndefined,
                              '@null': isUndefined,
                              '>': isUndefined,
                              '.nonExist': isUndefined,
                            },
                            'null': {
                              '': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 2,
                              '@string': isUndefined,
                              '@number': isUndefined,
                              '@date': isUndefined,
                              '@array': isUndefined,
                              '@object': isUndefined,
                              '@null': _ => Array.isArray(_) && _.every(__ => __===null) && _.length === 2,
                              '>': isUndefined,
                              '.nonExist': isUndefined,
                            },
                            'O': { '': isUndefined },
                          }
                        },
                      }
                    },
                  }
                },
              },
              '>': {
                '': {
                  '': isUndefined,
                  '@string': isUndefined,
                  '@number': isUndefined,
                  '@date': isUndefined,
                  '@null': isUndefined,
                  '@array': isUndefined,
                  '@object': isUndefined,
                },
              }
            },
          },
        },
      },
    }
  }
  // .O  === @object.O
  Object.assign(complexTests['A']['>']['.'], complexTests['A']['.'])
  Object.assign(complexTests['A']['>']['']['@object']['.'], complexTests['A']['.'])
  Object.assign(complexTests['A']['>']['>']['']['@object']['.'], complexTests['A']['>']['>']['.'])


  Object.assign(complexTests['A']['>']['']['@array']['>'], complexTests['A']['>']['>'])
  Object.assign(complexTests['A']['>']['>']['']['@array']['>'], complexTests['A']['>']['>']['>'])
  Object.assign(complexTests['A']['>']['>']['>']['']['@array']['>'], complexTests['A']['>']['>']['>']['>'])
  Object.assign(complexTests['A']['>']['>']['>']['>']['']['@array']['>'], complexTests['A']['>']['>']['>']['>']['>'])

  /*
  arrayObjectTest = arrayize(objectTests, '')
  arrayOfObjectTest = {
    '.': {
      ...arraySimpleTest,
    },
    '.O': {
      ...arrayObjectTest
    }
  }
  arrayTests = {
    //'.O.A>':  _ => true,
    '>>.A>': _ => true,
    //'>>': _ => true,
    '': {
      '': _ => Array.isArray(_) && _.length === array_length,
      ...arrayOfObjectTest,
    },
    '@string': isUndefined,
    '@number': isUndefined,
    '@date': isUndefined,
    '@array': _ => Array.isArray(_),
    '@object': isUndefined,
    '@null': isUndefined,
    '.nonExist': isUndefined,
    '>': {
      '': _ => Array.isArray(_) && _.length === array_length,
      '@string': _ => Array.isArray(_) && _.length === configs.A_string,
      '@number': _ => Array.isArray(_) && _.length === configs.A_number,
      '@date': _ => Array.isArray(_) && _.length === configs.A_date,
      '@null': _ => Array.isArray(_) && _.length === configs.A_null,
      '@array': {
        '': _ => Array.isArray(_) && _.length === configs.A_array,
        '>': {
          '': Array.isArray(_) && _.length === array_length + 1*configs.A_array,
          '@string': _ => Array.isArray(_) && _.length === configs.A_string*configs.A_array,
          '@number': _ => Array.isArray(_) && _.length === configs.A_number*configs.A_array,
          '@date': _ => Array.isArray(_) && _.length === configs.A_date*configs.A_array,
          '@null': _ => Array.isArray(_) && _.length === configs.A_null*configs.A_array,
        }
      },
      '@object': {
        '': _ => Array.isArray(_) && _.length === configs.A_object,
        ...arrayOfObjectTest,
      },
      ...arrayOfObjectTest,
    },
  }
  */

  let anybad = false
  console.log('example:', example)
  let vglobal = {t, example, analyser, anybad: false, get, dget}
  doTest(simpleTests, '', vglobal)
  doTest(objectTests, 'O', vglobal)
  doTest(complexTests, '', vglobal)
  if (vglobal.anybad) debugger
  debugger
  t.pass()
})
test.skip('test json explore syntax', t => {
  let analyser = new JsonAnalyser()
  let result = analyser.analysis(data)
  let types = {
    simple: [
      'title', 'title@string', 'title@number', 'title.nonExist', 'title>',
      'name', 'int',
    ],
    aS: [
      'aS', 'aS>', 'aS>@number', 'aS>@string', 'aS.nonExist',
    ],
    SND: [
      'SND', 'SND@string', 'SND@number', 'SND@date', 'SND@array', 'SND@object', 'SND.nonExist', 'SND>',
    ],
    aSND: [
      'aSND', 'aSND@string', 'aSND@number', 'aSND@date', 'aSND@array', 'aSND@object', 'aSND@null','aSND.nonExist',
      'aSND>', 'aSND>@string', 'aSND>@number', 'aSND>@date', 'aSND>@array', 'aSND>@object', 'aSND>@null',
    ],
    aSNDAO: [
      'aSNDAO', 'aSNDAO@string', 'aSNDAO@number', 'aSNDAO@date', 'aSNDAO@array', 'aSNDAO@object', 'aSNDAO.nonExist',
      'aSNDAO@array>', 'aSNDAO@array>@string', 'aSNDAO@array>@number', 'aSNDAO@array>@date', 'aSNDAO@array>@array', 'aSNDAO@array>@object',
      'aSNDAO>', 'aSNDAO>@string', 'aSNDAO>@number', 'aSNDAO>@date', 'aSNDAO>@array', 'aSNDAO>@object',
      'aSNDAO>@object.title', 'aSNDAO>@object.title@string', 'aSNDAO>@object.title@number',
      'aSNDAO>@object.aS',
      'aSNDAO>@array.aS',
      'aSNDAO>@object.aS@array',
      'aSNDAO>.aS',
      'aSNDAO>.aS@array',
      'aSNDAO.aS',
      'aSNDAO@array.aS',
      'aSNDAO@object.aS',
      'aSNDAO.aS@array',
      'aSNDAO.aS@null',
      'aSNDAO.aS@object',
      'aSNDAO.aS@string',
      'aSNDAO>@object.aS>',
      'aSNDAO>@object.aS@array>',
      'aSNDAO>.aS>',
      'aSNDAO>.aS@array>',
      'aSNDAO>.aS@null',
      'aSNDAO.aS>',
      'aSNDAO.aS@array>',
      'aSNDAO>@object.aS>@string', 'aSNDAO>@object.aS>@number',
    ],
    aSNDAMMO: [
      'aSNDAMMO', 'aSNDAMMO@string', 'aSNDAMMO@number', 'aSNDAMMO@date', 'aSNDAMMO@array', 'aSNDAMMO@object', 'aSNDAMMO.nonExist',
      'aSNDAMMO>', 'aSNDAMMO>@string', 'aSNDAMMO>@number', 'aSNDAMMO>@date', 'aSNDAMMO>@array', 'aSNDAMMO>@object',
      'aSNDAMMO>@object.title', 'aSNDAMMO>@object.title@string', 'aSNDAMMO>@object.title@number',
      'aSNDAMMO>@object.aS', 'aSNDAMMO>@object.aS@array', 'aSNDAMMO>@object.aS>', 'aSNDAMMO>@object.aS@array>', 'aSNDAMMO>@object.aS>@string', 'aSNDAMMO>@object.aS>@number',
      'aSNDAMMO>@object.aM', 'aSNDAMMO>@object.aM@object', 'aSNDAMMO>@object.aM@array', 'aSNDAMMO>@object.aM@string', 'aSNDAMMO>@object.aM@number', 'aSNDAMMO>@object.aM@date',
      'aSNDAMMO>@array>', 'aSNDAMMO>@array>@object',
      'aSNDAMMO>@array>@object.title',
      'aSNDAMMO>@array>@object.title@string',
      'aSNDAMMO>@array>@object.aO', 'aSNDAMMO>@array>@object.aO@array', 'aSNDAMMO>@array>@object.aO@object',
      'aSNDAMMO>@array>@object.aO>.title', 'aSNDAMMO>@array>@object.aO@array>.title',
      'aSNDAMMO>@array>@object.aO.title', 'aSNDAMMO>@array>@object.aO@array.title',
    ],
    aaa0: [
      'aaaO',
      'aaaO.title',
      'aaaO@array',
      'aaaO>',
      'aaaO>@array',
      'aaaO>>',
      'aaaO>>@array',
      'aaaO>>@object',
      'aaaO>.title',
      'aaaO>>.title',
      'aaaO>>.title@string',
    ]
  }
  let keys = Object.keys(types)
  let getType = {}
  let getValue = {}
  let getValueClean = {}
  let singleTest = [
    'aSNDAO',
    'aSNDAO@array',
    'aSNDAO@null',
    'aSNDAO>',
    'aSNDAO>@string',
    'aSNDAO>@number',
    'aSNDAO>@date',
    'aSNDAO>@array',
    'aSNDAO>@object',
    'aSNDAO>@null',
    'aSNDAO>.aS',
    'aSNDAO>@array',
    'aSNDAO>@array>',
    'aSNDAO>@array>@object',
    'aSNDAO>@array>@array',
    'aSNDAO>@array>@object.aS',
    'aSNDAO>@array.aS',
    'aSNDAO>@object.aS',
    'aSNDAO>.aS@null',
    'aSNDAO>.aS@array',
    'aSNDAO>@array.aS@null',
    'aSNDAO>@array.aS@array',
    'aSNDAO>@object.aS@null',
    'aSNDAO>@object.aS@array',
    'aSNDAO>.aS>',
    'aSNDAO>@array.aS>',
    'aSNDAO>@object.aS>',
    'aSNDAO>>',
    'aSNDAO>>@null',
    'aSNDAO>>@string',
    'aSNDAO>>@number',
    'aSNDAO>>@date',
    'aSNDAO>>@array',
    'aSNDAO>>@object',
    'aSNDAO>>.aS',
    'aSNDAO>>@object.aS',
    'aSNDAO>>@array.aS',
  ]
  if (singleTest.length) {
    for (let each of singleTest) {
      let singleType  = analyser.getTypeByPath(each)
      let singleValue = analyser.getValueByPath(data, each)
      let singleValueClean = singleValue.filter(_ => _!==undefined)
      console.log(each, {each, singleType, singleValue, singleValueClean})
    }
    debugger
  }
  for (let key of keys) {
    getType[key] = analyser.getTypeByPath(types[key])
    getValue[key] = analyser.getValueByPath(data, types[key])
    let values = analyser.getValueByPath(data, types[key])
    let valueKeys = Object.keys(values)
    for (let valuekey of valueKeys) {
      values[valuekey] = values[valuekey].filter(_ => _!==undefined)
    }
    getValueClean[key] = values
  }
  console.log('result:', result)
  console.log('getType:', getType)
  console.log('getValue:', getValue)
  console.log('getValueClean:', getValueClean)
  //let d = diff(getValueClean, data_result)
  //console.log('diff:', d)
  //t.deepEqual(getValueClean, data_result)
  debugger
	t.pass()
})
