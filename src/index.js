const csvtojson = require('csvtojson')
const ModulekitForm = require('modulekit-form')
const copy = require('copy-to-clipboard')
const hash = require('sheet-router/hash')
require('leaflet')

const httpGet = require('./httpGet')
const volkschuleFormDef = require('./volksschule.json')
const andereSchuleFormDef = require('./andereschule.json')

let schulen
let map
let marker
let layers = {}
let overlays = {}

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
    global.setTimeout(() => {
      if (location.hash && location.hash.length > 1) {
        schulen.value = location.hash.substr(1)
      }

      open()
    }, 1)

    hash(loc => {
      schulen.value = loc.substr(1)
      open()
    })
  })

  map = L.map('map')

  layers['Basemap.at'] = L.tileLayer('https://{s}.wien.gv.at/basemap/geolandbasemap/normal/google3857/{z}/{y}/{x}.png', {
    subdomains:['maps', 'maps1', 'maps2', 'maps3', 'maps4'], maxZoom:25, maxNativeZoom:19,
    bounds: L.latLngBounds(L.latLng(49.3,8.78),L.latLng(46.25,18.029)),
    attribution:'<a target="_blank" href="https://www.basemap.at/">basemap.at</a>',
    errorTileUrl:'/Karten/transparent.gif'
  })

  layers['Basemap.at Orthophoto'] = L.tileLayer('https://{s}.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg',{
    subdomains:['maps', 'maps1', 'maps2', 'maps3', 'maps4'], maxZoom:25, maxNativeZoom:19,
    attribution:'<a target="_blank" href="https://www.basemap.at/">basemap.at</a>',
    errorTileUrl:'/Karten/transparent.gif'
  })

  layers['Hauptradverkehrsnetz 2019'] = L.tileLayer('https://fahrrad.lima-city.de/Karten/HRVN2019/Z{z}/{y}/{x}.png', {
    minNativeZoom:10, maxZoom:25, maxNativeZoom:16,
    bounds: L.latLngBounds(L.latLng(48.326,16.154),L.latLng(48.1134,16.726)),
    attribution:'Stadt Wien – <a target="_blank" href="https://data.wien.gv.at">data.wien.gv.at</a>',
    errorTileUrl:'https://fahrrad.lima-city.de/Karten/transparent.gif'
  })

  layers['OpenStreetMap Mapnik'] = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom:25, maxNativeZoom:19,
  })

  let wmswien = L.WMS.source("https://data.wien.gv.at/daten/wms", {
    format: "image/png",
    transparent: "TRUE",
    tiled: false,
    maxZoom: 25,
    attribution: 'Stadt Wien – <a target="_blank" href="https://data.wien.gv.at">data.wien.gv.at</a>'
  })
  overlays['Radnetz Wien'] = wmswien.getLayer('RADWEGEOGD')
  overlays['Fahrradabstellanlagen'] = wmswien.getLayer('FAHRRADABSTELLANLAGEOGD,MOTORRADABSTELLPLATZOGD')

  L.control.layers(layers, overlays).addTo(map)
  layers['Basemap.at'].addTo(map)
  overlays['Radnetz Wien'].addTo(map)
  overlays['Fahrradabstellanlagen'].addTo(map)

  map.on('move', (e) => {
    let center = map.getCenter()
    document.getElementById('moremaps').innerHTML = "<a target='moremaps' href='https://fahrrad.lima-city.de/Karten/#" + map.getZoom() + "/" + center.lat.toFixed(5) + "/" + center.lng.toFixed(5) + "/basemaphidpi'>Mehr Karten</a>"
  })
}

function open () {
  let dom = document.getElementById('data')
  dom.innerHTML = ''

  if (!schulen.selectedOptions.length) {
    dom.innerHTML = 'Schule nicht gefunden'
    return
  }

  let option = schulen.selectedOptions[0]
  let data = option.data

  map.setView([data.LAT, data.LON], 18)
  if (marker) {
    marker.setLatLng([data.LAT, data.LON])
  } else {
    marker = L.marker([data.LAT, data.LON]).addTo(map)
  }

  location.hash = '#' + option.value

  let formDef
  if (data.ART_TXT.match(/^Volksschule/)) {
    formDef = volkschuleFormDef
  } else {
    form = andereSchuleFormDef
  }
  form = new ModulekitForm('data', formDef)
  form.show(dom)
  form.set_data(data)

  let input = document.createElement('input')
  input.type = 'submit'
  input.value = 'Daten in Zwischenablage kopieren (Ctrl-V zum Einfügen in Google Docs)'
  dom.appendChild(input)

  dom.onsubmit = () => {
    let changes = form.get_data()

    for (let k in changes) {
      data[k] = changes[k]
    }

    let str = '<table><tr>'
    for (let k in formDef) {
      str += '<td>' + (data[k] === null ? '' : data[k]) + '</td>'
    }
    str += '</tr></table>'
    copy(str, { format: 'text/html' })

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
