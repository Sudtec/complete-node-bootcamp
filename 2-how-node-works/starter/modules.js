const calc1 = require('./test1')
const {add, sub, divide} = require('./test2')

const Calc = new calc1()

console.log(Calc.add(2,5))
console.log(divide(2,5))

