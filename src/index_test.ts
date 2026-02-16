#! /usr/bin/env node

// type parseOptions<K extends string, V> = 
//     K extends "string" ? 
//     V extends { name: string; lastName: string;} ? V : never :  
//     K extends "number" ? { age: number; }: never;


// const someParsing = <K extends string,V>(k: K,test: parseOptions<K,V>) => {
   
// }

// someParsing("string", { name: "John", lastName: "Doe" });



// type getArrayType<T> = T extends (infer AT)[] ? AT : never;
// type getFuncType<T> = T extends (...args: any) => infer RT ? RT : never;
// type getParamType<T> = T extends (arg1: infer PT, ...args: any) => any ? PT : never;
// type getPromiseType<T> = T extends Promise<infer PT> ? PT: never;


// let array: getArrayType<number[]>;
// let funcType: getFuncType<() => string>;
// let paramType: getParamType<(arg1: Date) => void>; 
// let promiseType: getPromiseType<Promise<string>>;



// type extractParams<S extends string> = 
//     S extends `${string}{${infer Param}}${infer Rest}` ?
//     Param: 0;

// let test: extractParams<"prova {di} nuovo">



// type setFuncTypes<T> = T extends (arg1: (T extends number ? infer N : T)) => unknown ? N : T;

// let tt: setFuncTypes<string>;


// type parseOptions<K extends "string" | "number"> = 
//     K extends "string" ? 
//         {
//             name: string,
//             lastName: string
//         } :
//     K extends "number" ? 
//         {
//             age: number
//         }:
//     never;


// let test = <T extends "string"| "number">(k: T, v: parseOptions<T>) => {

// }

// test("number", {age: 1})



type toUpper<T> = {
    [K in keyof T as Uppercase<string & K>]:string
}

let test: toUpper<{}>;