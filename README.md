# json extract syntax
assume we have a complex json array, with these root fields
* name: String
* int: Number
* aS: array of String, or null
* aD: array of Date, or null
* aN: array of Number, or null
* aSND: array of (String|Number|Date), or null
* aSNDAO: array of (String|Number|Date|Array|Object), or null
* aaa0: array of (Array of Object, or null), or null
* o: Object
in the nested Array or Object, some of them also have these fields

we define a `json extract syntax(JES)` to quickly extract deep fields of a random json

* operators:
  * `@object`,`@array`,`@string`,`@number`,`@date`,`@null`: only extract value of this types
    * when the string is a ISO date format(YYYY-MM-DDThh:mm:ss), it will be extract as a date
  * `>`: inside a array
* examples:
  * `field`: extract the `field` field of current data
  * `@type`: extract the field of current data only if its type is `type`, or will return undefined
  * `>`: if current data is array, go into the array(flatten the array), or will return undefined
  * `.subfield`
    * if current data is an object, extract the `subfield`
    * if current data is an array: map its values as below, if not return undefined
      * if the value is an object, extract `subfield` and map, or map undefined
      * if the values in the mapped array are all undefined, retrun undefined
    ```
    let example = \
    {
      name: 'haha',
      a0:{
        a0value: 123
      },
      a1: [
        10,
        '2000-01-01T00:00:00',
        'a1_abc',
        {a2: [20, 'a2_abc']},
        {a2: [21, 'a2_xyz']},
        [21,'abc'],
        [22,{a3: [30,'a3_abc']}],
      ]
    }
    extract by 'name' ==> 'haha'
    extract by 'name@string' ==> 'haha'
    extract by 'name@number' ==> undefined
    extract by 'name>' ==> undefined
    extract by 'name.nonExist' ==> undefined
    extract by 'a0' ==> {a0value:123}
    extract by 'a0@object' ==> {a0value:123}
    extract by 'a0@array' ==> undefined
    extract by 'a0.a0value' ==> 123
    extract by 'a0.a0value@number' ==> 123
    extract by 'a0.a0value@string' ==> undefined
    extract by 'a1' ==> example.a1 (too long to pring in this line)
    extract by 'a1@array' ==> example.a1 (too long to pring in this line)
    extract by 'a1@object' ==> undefined
    extract by 'a1>' ==> example.a1 (too long to pring in this line)
    extract by 'a1>@number' ==> [10]
    extract by 'a1>@date' ==> ['2000-01-01T00:00:00']
    extract by 'a1>@string' ==> ['a1_abc']
    extract by 'a1>@object' ==> [ {a2: [20, 'a2_abc']}, {a2: [21, 'a2_xyz']},]
    extract by 'a1.a2' or
    extract by 'a1>.a2' or
    extract by 'a1>@object.a2' ==> [[20, 'a2_abc'], [21, 'a2_xyz']]
    extract by 'a1.a2>' ==> [20, 'a2_abc', 21, 'a2_xyz']
    extract by 'a1.a2>@number' ==> [20, 21]
    extract by 'a1.a2>@string' ==> ['a2_abc', 'a2_xyz']
    extract by 'a1>@array' ==> [ [21,'abc'], [22,{a3: [30,'a3_abc']}]]
    extract by 'a1>>' or
    extract by 'a1>@array>' ==> [ 21,'abc', 22, {a3: [30,'a3_abc']}]
    extract by 'a1>>@object.a3' or
    extract by 'a1>>.a3' ==> [[30,'a3_abc']]
    extract by 'a1>>.a3>' ==> [30,'a3_abc']
    extract by 'a1>>.a3>@number' ==> [30]
    extract by 'a1>>.a3>@string' ==> ['a3_abc']
    extract by 'a1>>.a3>@date' ==> undefined

    a much more complex example is shown in the test suite
  ```
