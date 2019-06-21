# design of the filter syntax and data structure
* components <==> structure dict

* logical structures
  * nested
    ``` javascript
    {
      type: "nested",
      child: one,
      prefix:"", suffix:"", newline: one,
      string: "(one)",
    }
    (A)==> {
      type: "nested",
      child: A,
      newline: false, prefix:"", suffix:"",
      string: "(A)"
    }
    ```
  * and|or
    ``` javascript
    {
      type: "logical",
      subtype: "and|or",
      children: [...],
      delimiters: [...(same length as children)],
      newlines: [...(same length as children)],
      string: "<sync bind with content in other fileds>",
    }
    A B && C ==> {
      type: "logical", subtype: "and",
      children: [A, B, C], delimiters: [" ", "&& ", ""], newlines: [false, false, false],
      string: "A B && C"
    }
    A B || C && D ==> {
      type: "logical", subtype: "or",
      children: [
        {
          type: "logical", subtype: "and",
          children:[A, B], delimiters: [" ", ""], newlines: [false, false],
          string:"A B",
        },
        {
          type: "logical", subtype: "and",
          children:[C, D], delimiters: [" && ", ""], newlines: [false, false],
          string:"C && D",
        },
      ], delimiters: [" || ", ""], newlines: [false, false],
      string: "A B || C && D"
    }
    ```
    * value
    ``` javascript
    {
      type: "block",
      string: "",
      value: "",
    }
    1 ==> {
      type: "block",
      string: "1",
      value: 1,
    }
    "1" ==> {
      type: "block",
      string: "\"1\"",
      value: "1",
    }
    /123/ ==> {
      type: "block",
      string: "/123/",
      value: /123/,
    }
    2018-01-01T12:00:00 => {
      type: "block",
      string: "2018-01-01T12:00:00",
      value: Date("2018-01-01T12:00:00"),
    }
    // change
    string==="()" => nested
    string.endsWith(':') => query.key
    ```
    * query
    ``` javascript
    {
      type: "query",
      key: {},
      value: {},
      string: ""
    }
    ```
    * key
    ``` javascript
    {
      type: "query",
      string: ""
    }
    ```
