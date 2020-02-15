const csvtojson = require('csvtojson')
const ModulekitForm = require('modulekit-form')

const httpGet = require('./httpGet')
const formDef = require('./form.json')

let schulen

global.lang_str = {}

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

  let dom = document.getElementById('data')
  dom.innerHTML = ''

  let form = new ModulekitForm('data', formDef)
  form.show(dom)
  form.set_data(data)
}
