const csvtojson = require('csvtojson')
const ModulekitForm = require('modulekit-form')
require('leaflet')

const httpGet = require('./httpGet')
const formDef = require('./form.json')

let schulen
let map
let marker

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

  map = L.map('map')

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

function open () {
  let option = schulen.selectedOptions[0]
  let data = option.data

  map.setView([data.LAT, data.LON], 18)
  if (marker) {
    marker.setLatLng([data.LAT, data.LON])
  } else {
    marker = L.marker([data.LAT, data.LON]).addTo(map)
  }

  let dom = document.getElementById('data')
  dom.innerHTML = ''

  let form = new ModulekitForm('data', formDef)
  form.show(dom)
  form.set_data(data)

  let input = document.createElement('input')
  input.type = 'submit'
  input.value = 'Speichern'
  dom.appendChild(input)

  dom.onsubmit = () => {
    let changes = form.get_data()

    for (let k in changes) {
      data[k] = changes[k]
    }

    let req = new XMLHttpRequest()
    req.onreadystatechange = () => {
      if (req.readyState === 4) {
        if (req.status === 200) {
          alert('Gespeichert.')
        } else {
          alert(req.responseText)
        }
      }
    }

    req.open('POST', 'save.php?id=' + data.FID, true)
    req.send(JSON.stringify(changes))

    return false
  }
}
