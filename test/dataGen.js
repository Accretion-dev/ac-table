const efaker = require('faker/locale/en_US')
const zfaker = require('faker/locale/zh_CN')
const fs = require('fs')
const path = require('path')

function RI(a,b) {
  return Math.floor(Math.random() * (b-a)) + a
}

const fakers = [ efaker, zfaker ]
function F(input) {
  if (input === 'float') {
    return Math.random()*20000-10000
  } else if (typeof(input)==='function') {
    return input()
  } else if (Array.isArray(input)) {
    // console.log({input, isArray: Array.isArray(input)})
    let randIndex = Math.floor(Math.random() * 2)
    let facker = fakers[randIndex]
    let [func, ...para] = input
    if (func.includes('.')) {
      for (let path of func.split('.')) {
        facker = facker[path]
      }
    } else {
      func = facker[func]
    }
    return facker(...para)
  } else {
    if (input.fields) {
      if (input.missing) { // could miss
        let good = Math.random()>input.missing
        if (!good) return null
      }
      if (input.array) { // array of object
        let count = RI(...input.count)
        let output = []
        for (let i=0;i<count;i++) {
          let result = {}
          for (let key in input.fields) {
            result[key] = F(input.fields[key])
          }
          output.push(result)
        }
        return output
      } else { // object
        let result = {}
        for (let key in input.fields) {
          result[key] = F(input.fields[key])
        }
        return result
      }
    } else { // must have types
      let type
      if (input.type) {
        type = input.type
      } else { // must have types
        type = input.types[Math.floor(Math.random() * input.types.length)]
      }
      if (input.missing) { // could miss
        let good = Math.random()>input.missing
        if (!good) return null
      }
      if (input.array) { // array of object, must have count
        let count = RI(...input.count)
        let output = []
        for (let i=0;i<count;i++) {
          output.push(F(type))
        }
        return output
      } else { // object
        let result = F(type)
        return result
      }
    }
  }
}

let rString = ['name.findName']
let rNumber = ['random.number', 99999]
let rDate = ['date.between', 2018, 2020]

let struct0 = {
  fields:{
    title: ['random.words', 3, 10],
    name: rString,
    int: rNumber,
    value: 'float',
    ex_title: ['random.words', 3, 10],
    ex_name: rString,
    ex_int: rNumber,
    ex_value: 'float',
    ex_date: rDate,
    aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
    aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
    aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
    aO: {
      count: [0,3],
      array: true,
      fields: {
        title: ['random.words', 3, 10],
        name: rString,
        int: rNumber,
        value: 'float',
        date: rDate,
        aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
        aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
        aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
      }
    },
    aSND: { missing: 0.1, count: [0,5], array: true, types:[rString, rNumber, rDate, 'float']},
    SND: {missing: 0.5, types:[
      rString,
      rNumber,
      rDate,
      'float'
    ]},
    SNDAO: {missing: 0.5, types:[
      rString,
      rNumber,
      rDate,
      'float',
       {
         count: [0,3],
         array: true,
         fields: {
           title: ['random.words', 3, 10],
           name: rString,
           int: rNumber,
           value: 'float',
           date: rDate,
           aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
           aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
           aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
         }
       },
       {
         array: false,
         fields: {
           title: ['random.words', 3, 10],
           name: rString,
           int: rNumber,
           value: 'float',
           date: rDate,
           aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
           aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
           aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
         }
       }
    ]},
    aSNDAO: {missing: 0.5, count: [0,3], array: true, types:[
      rString,
      rNumber,
      rDate,
      'float',
       {
         count: [0,3],
         array: true,
         fields: {
           title: ['random.words', 3, 10],
           name: rString,
           int: rNumber,
           value: 'float',
           date: rDate,
           aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
           aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
           aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
         }
       },
       {
         array: false,
         fields: {
           title: ['random.words', 3, 10],
           name: rString,
           int: rNumber,
           value: 'float',
           date: rDate,
           aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
           aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
           aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
         }
       }
    ]},
    SNDAMO: {missing: 0.5, types:[
      rString,
      rNumber,
      rDate,
      'float',
       {
         count: [0,3],
         array: true,
         missing: 0.1,
         types:[
           rString,
           rNumber,
           rDate,
           'float',
           {
             count: [0,3],
             array: true,
             fields: {
               title: ['random.words', 3, 10],
               name: rString,
               int: rNumber,
               value: 'float',
               date: rDate,
               aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
               aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
               aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
             }
           },
           {
             array: false,
             fields: {
               title: ['random.words', 3, 10],
               name: rString,
               int: rNumber,
               value: 'float',
               date: rDate,
               aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
               aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
               aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
             }
           }
         ],
       },
       {
         array: false,
         fields: {
           title: ['random.words', 3, 10],
           name: rString,
           int: rNumber,
           value: 'float',
           date: rDate,
           aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
           aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
           aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
         }
       }
    ]},
    aaaO: {missing: 0.1, count: [0,3], array: true, types:[
      {missing: 0.1, count: [0,3], array: true, types:[
        {missing: 0.1, count: [0,3], array: false,
           fields: {
             title: ['random.words', 3, 10],
             name: rString,
             int: rNumber,
             value: 'float',
             date: rDate,
             aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
             aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
             aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
           }
        }
      ]}
    ]},
    aSNDAMO: {missing: 0.5, count: [0,3], array: true, types:[
      rString,
      rNumber,
      rDate,
      'float',
       {
         count: [0,3],
         array: true,
         missing: 0.1,
         types:[
           rString,
           rNumber,
           rDate,
           'float',
           {
             count: [0,3],
             array: true,
             fields: {
               title: ['random.words', 3, 10],
               name: rString,
               int: rNumber,
               value: 'float',
               date: rDate,
               aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
               aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
               aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
               aO: {
                 count: [0,3],
                 array: true,
                 fields: {
                   title: ['random.words', 3, 10],
                   name: rString,
                   int: rNumber,
                   value: 'float',
                   date: rDate,
                   aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                   aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                   aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                 }
               },
             }
           },
           {
             array: false,
             fields: {
               title: ['random.words', 3, 10],
               name: rString,
               int: rNumber,
               value: 'float',
               date: rDate,
               aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
               aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
               aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
               aO: {
                 count: [0,3],
                 array: true,
                 fields: {
                   title: ['random.words', 3, 10],
                   name: rString,
                   int: rNumber,
                   value: 'float',
                   date: rDate,
                   aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                   aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                   aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                 }
               },
             }
           }
         ],
       },
       {
         array: false,
         fields: {
           title: ['random.words', 3, 10],
           name: rString,
           int: rNumber,
           value: 'float',
           date: rDate,
           aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
           aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
           aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
         }
       }
    ]},
    aSNDAMMO: {missing: 0.5, count: [0,3], array: true, types:[
      rString,
      rNumber,
      rDate,
      'float',
       {
         count: [0,3],
         array: true,
         missing: 0.1,
         types:[
           rString,
           rNumber,
           rDate,
           'float',
           {
             count: [0,3],
             array: true,
             missing: 0.1,
             types:[
               rString,
               rNumber,
               rDate,
               'float',
               {
                 count: [0,3],
                 array: true,
                 fields: {
                   title: ['random.words', 3, 10],
                   name: rString,
                   int: rNumber,
                   value: 'float',
                   date: rDate,
                   aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                   aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                   aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                   aO: {
                     count: [0,3],
                     array: true,
                     fields: {
                       title: ['random.words', 3, 10],
                       name: rString,
                       int: rNumber,
                       value: 'float',
                       date: rDate,
                       aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                       aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                       aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                     }
                   },
                   aM: {missing: 0.5, types:[
                     rString,
                     rNumber,
                     rDate,
                     'float',
                     {
                       count: [0,3],
                       array: true,
                       missing: 0.1,
                       types:[
                         rString,
                         rNumber,
                         rDate,
                         'float',
                         {
                           count: [0,3],
                           array: true,
                           fields: {
                             title: ['random.words', 3, 10],
                             name: rString,
                             int: rNumber,
                             value: 'float',
                             date: rDate,
                             aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                             aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                             aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                           }
                         },
                         {
                           array: false,
                           fields: {
                             title: ['random.words', 3, 10],
                             name: rString,
                             int: rNumber,
                             value: 'float',
                             date: rDate,
                             aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                             aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                             aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                           }
                         }
                       ],
                     },
                     {
                       array: false,
                       fields: {
                         title: ['random.words', 3, 10],
                         name: rString,
                         int: rNumber,
                         value: 'float',
                         date: rDate,
                         aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                         aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                         aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                       }
                     }
                   ]}
                 }
               },
               {
                 array: false,
                 fields: {
                   title: ['random.words', 3, 10],
                   name: rString,
                   int: rNumber,
                   value: 'float',
                   date: rDate,
                   aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                   aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                   aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                   aO: {
                     count: [0,3],
                     array: true,
                     fields: {
                       title: ['random.words', 3, 10],
                       name: rString,
                       int: rNumber,
                       value: 'float',
                       date: rDate,
                       aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                       aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                       aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                       aM: {missing: 0.5, types:[
                         rString,
                         rNumber,
                         rDate,
                         'float',
                         {
                           count: [0,3],
                           array: true,
                           missing: 0.1,
                           types:[
                             rString,
                             rNumber,
                             rDate,
                             'float',
                             {
                               count: [0,3],
                               array: true,
                               fields: {
                                 title: ['random.words', 3, 10],
                                 name: rString,
                                 int: rNumber,
                                 value: 'float',
                                 date: rDate,
                                 aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                                 aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                                 aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                               }
                             },
                             {
                               array: false,
                               fields: {
                                 title: ['random.words', 3, 10],
                                 name: rString,
                                 int: rNumber,
                                 value: 'float',
                                 date: rDate,
                                 aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                                 aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                                 aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                               }
                             }
                           ],
                         },
                         {
                           array: false,
                           fields: {
                             title: ['random.words', 3, 10],
                             name: rString,
                             int: rNumber,
                             value: 'float',
                             date: rDate,
                             aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                             aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                             aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                           }
                         }
                       ]}
                     }
                   },
                 }
               }
             ],
           },
           {
             array: false,
             fields: {
               title: ['random.words', 3, 10],
               name: rString,
               int: rNumber,
               value: 'float',
               date: rDate,
               aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
               aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
               aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
               aO: {
                 count: [0,3],
                 array: true,
                 fields: {
                   title: ['random.words', 3, 10],
                   name: rString,
                   int: rNumber,
                   value: 'float',
                   date: rDate,
                   aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                   aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                   aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                   aO: {
                     count: [0,3],
                     array: true,
                     fields: {
                       title: ['random.words', 3, 10],
                       name: rString,
                       int: rNumber,
                       value: 'float',
                       date: rDate,
                       aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                       aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                       aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                       aM: {missing: 0.5, types:[
                         rString,
                         rNumber,
                         rDate,
                         'float',
                         {
                           count: [0,3],
                           array: true,
                           missing: 0.1,
                           types:[
                             rString,
                             rNumber,
                             rDate,
                             'float',
                             {
                               count: [0,3],
                               array: true,
                               fields: {
                                 title: ['random.words', 3, 10],
                                 name: rString,
                                 int: rNumber,
                                 value: 'float',
                                 date: rDate,
                                 aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                                 aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                                 aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                               }
                             },
                             {
                               array: false,
                               fields: {
                                 title: ['random.words', 3, 10],
                                 name: rString,
                                 int: rNumber,
                                 value: 'float',
                                 date: rDate,
                                 aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                                 aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                                 aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                               }
                             }
                           ],
                         },
                         {
                           array: false,
                           fields: {
                             title: ['random.words', 3, 10],
                             name: rString,
                             int: rNumber,
                             value: 'float',
                             date: rDate,
                             aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                             aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                             aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                           }
                         }
                       ]}
                     }
                   },
                   aM: {missing: 0.5, types:[
                     rString,
                     rNumber,
                     rDate,
                     'float',
                     {
                       count: [0,3],
                       array: true,
                       missing: 0.1,
                       types:[
                         rString,
                         rNumber,
                         rDate,
                         'float',
                         {
                           count: [0,3],
                           array: true,
                           fields: {
                             title: ['random.words', 3, 10],
                             name: rString,
                             int: rNumber,
                             value: 'float',
                             date: rDate,
                             aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                             aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                             aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                           }
                         },
                         {
                           array: false,
                           fields: {
                             title: ['random.words', 3, 10],
                             name: rString,
                             int: rNumber,
                             value: 'float',
                             date: rDate,
                             aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                             aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                             aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                           }
                         }
                       ],
                     },
                     {
                       array: false,
                       fields: {
                         title: ['random.words', 3, 10],
                         name: rString,
                         int: rNumber,
                         value: 'float',
                         date: rDate,
                         aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                         aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                         aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                       }
                     }
                   ]}
                 }
               },
             }
           }
         ],
       },
       {
         array: false,
         fields: {
           title: ['random.words', 3, 10],
           name: rString,
           int: rNumber,
           value: 'float',
           date: rDate,
           aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
           aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
           aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
           aO: {
             count: [0,3],
             array: true,
             fields: {
               title: ['random.words', 3, 10],
               name: rString,
               int: rNumber,
               value: 'float',
               date: rDate,
               aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
               aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
               aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
               aM: {missing: 0.5, types:[
                 rString,
                 rNumber,
                 rDate,
                 'float',
                 {
                   count: [0,3],
                   array: true,
                   missing: 0.1,
                   types:[
                     rString,
                     rNumber,
                     rDate,
                     'float',
                     {
                       count: [0,3],
                       array: true,
                       fields: {
                         title: ['random.words', 3, 10],
                         name: rString,
                         int: rNumber,
                         value: 'float',
                         date: rDate,
                         aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                         aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                         aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                       }
                     },
                     {
                       array: false,
                       fields: {
                         title: ['random.words', 3, 10],
                         name: rString,
                         int: rNumber,
                         value: 'float',
                         date: rDate,
                         aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                         aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                         aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                       }
                     }
                   ],
                 },
                 {
                   array: false,
                   fields: {
                     title: ['random.words', 3, 10],
                     name: rString,
                     int: rNumber,
                     value: 'float',
                     date: rDate,
                     aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                     aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                     aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                   }
                 }
               ]}
             }
           },
           aM: {missing: 0.5, types:[
             rString,
             rNumber,
             rDate,
             'float',
             {
               count: [0,3],
               array: true,
               missing: 0.1,
               types:[
                 rString,
                 rNumber,
                 rDate,
                 'float',
                 {
                   count: [0,3],
                   array: true,
                   fields: {
                     title: ['random.words', 3, 10],
                     name: rString,
                     int: rNumber,
                     value: 'float',
                     date: rDate,
                     aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                     aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                     aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                   }
                 },
                 {
                   array: false,
                   fields: {
                     title: ['random.words', 3, 10],
                     name: rString,
                     int: rNumber,
                     value: 'float',
                     date: rDate,
                     aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                     aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                     aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
                   }
                 }
               ],
             },
             {
               array: false,
               fields: {
                 title: ['random.words', 3, 10],
                 name: rString,
                 int: rNumber,
                 value: 'float',
                 date: rDate,
                 aS: { missing: 0.1, count: [0,5], array: true, type: rString, },
                 aN: { missing: 0.1, count: [0,5], array: true, type: rNumber, },
                 aD: { missing: 0.1, count: [0,5], array: true, type: rDate, },
               }
             }
           ]}
         }
       }
    ]},
  }
}
let struct1 = JSON.parse(JSON.stringify(struct0))
struct1.fields.o = {
  array: false,
  fields: struct0.fields
}
struct1.fields.ao1 = {
  count: [0,3],
  array: true,
  fields: struct0.fields
}
struct1 = JSON.parse(JSON.stringify(struct1))

let struct2 = JSON.parse(JSON.stringify(struct1))
struct2.fields.ao2 = {
  count: [0,3],
  array: true,
  fields: struct1.fields
}
struct2 = JSON.parse(JSON.stringify(struct2))

function gen(N) {
  let result = []
  for (let i=0; i<N; i++) {
    let each = F(struct1)
    result.push(each)
  }
  return result
}
function gen2(N) {
  let result = []
  for (let i=0; i<N; i++) {
    let each = F(struct2)
    result.push(each)
  }
  return result
}

let data = gen(3999)
let data2 = gen2(3999)

fs.writeFile(
  __dirname + '/data/3999.json',
  JSON.stringify(data,null,2),
  {flag: 'w'},
  function (err) {
   if(err) {
    console.error(err);
    } else {
       console.log('write done');
    }
})

fs.writeFile(
  __dirname + '/data/3999_2.json',
  JSON.stringify(data2,null,2),
  {flag: 'w'},
  function (err) {
   if(err) {
    console.error(err);
    } else {
       console.log('write done');
    }
})
