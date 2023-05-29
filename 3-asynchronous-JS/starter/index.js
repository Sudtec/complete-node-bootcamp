const fs = require('fs');
const superagent = require('superagent');

const readFilePro = (file) => {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf-8', (err, data) => {
            if (err) reject('Can`t read this file 😭');
            resolve(data);
        })
    })
}

const writeFilePro = (file, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, data, (err) => {
            console.log(data, 'ints')
            if (err) reject('I couldnt write the file')
            resolve('successfully')
        })
    })
}


// readFilePro(`${__dirname}/dog.txt`)
//     .then((data) => {
//         return superagent.get(`https://dog.ceo/api/breed/${data}/images/random`);
//     })
//     .then(response => {
//         console.log(response.body, 'also')
//         return writeFilePro('dog-img.txt', response.body.message)
//     })
//     .then(() => {
//         console.log('done')
//     })
//     .catch((err) => {
//         console.log(err, 'here1')
//     })

/// Async Await 
const getDogPic = async () => {
    try {
        const data = await readFilePro(`${__dirname}/dog.txt`)
        console.log(data)
        const resPro1 = superagent.get(`https://dog.ceo/api/breed/${data}/images/random`)
        const resPro2 = superagent.get(`https://dog.ceo/api/breed/${data}/images/random`)
        const resPro3 = superagent.get(`https://dog.ceo/api/breed/${data}/images/random`)

        const allRes = await  Promise.all([resPro1, resPro2, resPro3])
        const images = allRes.map(item => item.body.message)
        await writeFilePro('dog-img.txt', images.join('\n'))
        console.log("Done writing")
    } catch (error) {
        console.log(error, 'n')
        throw (error)
    }
    return '2: Ready 🐶'
}

// getDogPic().then((x) => {
//     console.log(x)
//     console.log('done getting dog')
// }).catch((error) => {
//     console.log('Error 💥')
// })
(async () => {
    try {
        const x = await getDogPic()
        console.log(x)
    } catch (error) {
        console.log('Error 💥')
    }
})()

// fs.readFile(`${__dirname}/dog.txt`, "utf-8", (err, data) => {
//     if (err) console.log(err.message)
//     superagent.get(`https://dog.ceo/api/breed/${data}/images/random`).then(response => {
//         fs.writeFile('dog-img.txt', response.body.message, (err) => {
//             if (err) return console.log(err.message)
//             console.log('File written successfully')
//         })
//     }).catch(err => {
//         console.log(err.message)
//     })
// })