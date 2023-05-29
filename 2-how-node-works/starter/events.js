const EventEmitter = require('events')

const myEmitter = new EventEmitter();

myEmitter.on('onSales', ()=> {
    console.log('Anew sale was made')
})
myEmitter.on('onSales', ()=> {
    console.log('by Sodiq')
})
myEmitter.on('onSales', (date)=> {
    console.log(`on the ${date} of this month`)
})

myEmitter.emit('onSales', 2)


