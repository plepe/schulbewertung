const csvtojson = require('csvtojson')

const httpGet = require('./httpGet')

window.onload = () => {
  httpGet('data/schulen.csv', {}, (err, result) => {
    if (err) {
      return alert(err)
    }

    csvtojson()
      .fromString(result.body)
      .subscribe((line) => {
        console.log(line)
      })
  })
}
