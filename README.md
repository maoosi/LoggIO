# LoggIO

Tiny Node.js JavaScript runtime library to parse and analyse logs.

## Supported formats

- [x] Apache Combined Log

## Quick start

Clone the repo, then run:

```bash
# install dependencies
yarn install

# run tests
yarn test

# run report example
yarn report
```

## Usage

```javascript
// import library
import LoggIO from './path-to-loggio'

// instantiate using Apache Combined Log format
const loggIO = new LoggIO({ format: 'APACHE_COMBINED' })

// parse new logs from .log file
loggIO.read('./data.log')

// perform operation after data is parsed
loggIO.on('data', (data) => {

    // output number of unique ip addresses from logs
    data.query().unique('ip').count()

    // output top 3 most visited urls from logs
    data.query().sort('referer').unique('referer').limit(3).toJson()

    // output top 3 most active ip addresses from logs
    data.query().sort('ip').unique('ip').limit(3).toJson()

})
```

## API and events

```javascript
/* Parser API */
.read(filepath)            // Read log file from `filepath`

/* Events */
.on('data', data => {})   // Event subscriber, triggered after each data chunk parsed

/* Chainable data stream API */
.query()                  // Perform query on parsed logs (also act as query reset)
.unique([key])            // Filter logs by unique occurences of `key` value
.limit([max])             // Limit results starting from the first until `max` element
.sort(key)                // Sort logs by occurences frequency of `key` value
.toJson()                 // Output results in JSON (not chainable)
.count()                  // Output results count (not chainable)
```

## Dependencies

- `mitt`: Tiny 200b dependency-free event emitter / pubsub.
- `fs`: Part of the Node.js core.
- `readline`: Part of the Node.js core.

## Possible improvements

- [ ] Convert to TypeScript
- [ ] Write better parser using Nearley or similar
- [ ] Support for huge log files
- [ ] Adapt for various log formats
- [ ] Extend API methods and events
- [ ] Watch log files and parse in real-time
- [ ] Write better documentation
- [ ] Improve error feedback
