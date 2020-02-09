import mitt from 'mitt'
import fs from 'fs'
import readline from 'readline'

export default class {

    /**
     * Class constructor / new LoggIO instance
    */
    constructor({ format='APACHE_COMBINED' } = {}) {
        if (!['APACHE_COMBINED'].includes(format))
            throw new Error(`Format '${format}' is not supported.`)

        // class variables
        this.format = format
        this.logs = []
        this.results = false
        this.emitter = mitt()

        return this
    }

    /**
     * Read log file from `filepath`
    */
    read(filepath) {
        try { fs.accessSync(filepath, fs.constants.R_OK) }
        catch { throw new Error(`File '${filepath}' doesn't exist or can't be read.`) }

        // create a read stream on the log file
        const lineReader = readline.createInterface({
            input: fs.createReadStream(filepath)
        })
        
        // parse and store formatted logs line by line
        lineReader.on('line', line => {
            let formattedLogs = this._parse(line)
            if (formattedLogs) this.logs.push(formattedLogs)
        })

        // emit event after we reach the end of the logs file
        lineReader.on('close', () => this.emitter.emit('data', this))
        
        return this
    }

    /**
     * Perform query on parsed logs
    */
    query() {
        // reset the query results
        this.results = this.logs

        return this
    }

    /**
     * Filter logs by unique occurences of `key` value
    */
    unique(key = null) {
        this._checkQuery()

        // filter by matching indexes
        this.results = this.results.filter((log, index, results) =>
            index === results.findIndex((otherLog, otherIndex)  => {
                if (key === null) return JSON.stringify(otherLog) === JSON.stringify(log)
                else if (otherLog.hasOwnProperty(key)) return otherLog[key] === log[key]
                else return index === otherIndex
            })
        )

        return this
    }

    /**
     * Limit results starting from the first until `max` element
    */
    limit(max = 1) {
        this._checkQuery()
        if (max < 1) throw new Error(`Missing 'max' parameter for .limit(max) API method.`)

        // limit results starting from the first until `max` element
        this.results = this.results.splice(0, max)

        return this
    }

    /**
     * Sort logs by occurences frequency of `key` value
    */
    sort(key) {
        this._checkQuery()
        if (!key) throw new Error(`Missing 'key' parameter for .sort(key) API method.`)

        // count and record the number of occurences for each `key`
        this.results.forEach((log, index) => {
            this.results[index][`${key}_occurences`] = log.hasOwnProperty(key)
                ? this.results.filter(otherLog => otherLog[key] === log[key]).length
                : 0
        })

        // find the right sorting order based on number of occurences
        // then re-order the results based on indexes
        this.results = Object.keys(this.results)
            .sort((a, b) => {
                return this.results[b][`${key}_occurences`] - this.results[a][`${key}_occurences`]
            })
            .map((sortIndex) => this.results[sortIndex])

        return this
    }

    /**
     * Output results count (not chainable)
    */
    count() {
        this._checkQuery()
        return this.results.length
    }
    
    /**
     * Output results in JSON (not chainable)
    */
    toJson() {
        this._checkQuery()
        return this.results
    }

    /**
     * Event subscribers
    */
    on(...args) { return this.emitter.on(...args) }
    off(...args) { return this.emitter.off(...args) }

    /**
     * Private function to check that .query() is called before any other API method
    */
    _checkQuery() {
        if (!Array.isArray(this.results)) throw new Error(`Missing query() API method.`)
    }

    /**
     * Private function to parse a single line and return log object
    */
    _parse(line) {
        let matches

        // Apache Combined Log Format
        if (this.format === 'APACHE_COMBINED') {

            // LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-agent}i\"" combined
            matches = line.match(/^(\S+) (\S+) (\S+) \[([\w:/]+\s[+\-]\d{4})\] "(\S+)\s?(\S+)?\s?(\S+)?" (\d{3}|-) (\d+|-)\s?"?([^"]*)"?\s?"?([^"]*)?"?\s?(\S+)?\s?(\S+)?$/)

            // Parse and extract log object:
            // { ip, userId, time, method, referer, protocol, statusCode, size, userAgent, extra1, extra2 }
            if (matches) {
                return {
                    raw: line,
                    ...(matches[1] && { ip: matches[1] }),
                    ...(matches[3] && matches[3] !== '-' && { userId: matches[3] }),
                    ...(matches[4] && { time: matches[4] }),
                    ...(matches[5] && { method: matches[5] }),
                    ...(matches[6] && { referer: matches[6] }),
                    ...(matches[7] && { protocol: matches[7] }),
                    ...(matches[8] && { statusCode: matches[8] }),
                    ...(matches[9] && { size: matches[9] }),
                    ...(matches[11] && { userAgent: matches[11] }),
                    ...(matches[12] && { extra1: matches[12] }),
                    ...(matches[13] && { extra2: matches[13] })
                }
            }
        }

        return null
    }

}