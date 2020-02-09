import LoggIO from '../src/index.js'
import path from 'path'

// instantiate using `Apache Combined Log` format
const loggIO = new LoggIO({ format: 'APACHE_COMBINED' })

// read .log file content
loggIO.read( path.join(__dirname, './data.log') )

// new data stream event
loggIO.on('data', (data) => {

    // query information using LoggIO API
    let uniqueIpAddresses = data.query().unique('ip').count()
    let mostVisitedUrls = data.query().sort('referer').unique('referer').limit(3).toJson()
    let mostActiveIpAddresses = data.query().sort('ip').unique('ip').limit(3).toJson()

    // format results for console output
    mostVisitedUrls = mostVisitedUrls.map(r => r.referer).join('\n')
    mostActiveIpAddresses = mostActiveIpAddresses.map(r => r.ip).join('\n')

    // output results
    console.log(`\n# Number of unique IP addresses:\n${uniqueIpAddresses}\n`)
    console.log(`# Top 3 most visited URLs:\n${mostVisitedUrls}\n`)
    console.log(`# Top 3 most active IP addresses:\n${mostActiveIpAddresses}\n`)
    
})
