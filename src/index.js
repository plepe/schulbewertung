const csvtojson = require('csvtojson')

const httpGet = require('./httpGet')

let schulen

window.onload = () => {
  httpGet('data/schulen.csv', {}, (err, result) => {
    if (err) {
      return alert(err)
    }

    schulen = document.getElementById('schulen')

    csvtojson()
      .fromString(result.body)
      .subscribe((line) => {
        let option = document.createElement('option')
        option.value = line.FID
        option.data = line
        option.appendChild(document.createTextNode(line.BEZIRK + ', ' + line.NAME))
        schulen.appendChild(option)
      })

    schulen.onchange = open
    global.setTimeout(open, 1)
  })
}

function open () {
  let option = schulen.selectedOptions[0]
  let data = option.data
  console.log(data)
}
