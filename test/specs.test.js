import LoggIO from '../src/index.js'
import path from 'path'

var [loggIO, logFile] = [, path.join(__dirname, './test.log')]

beforeEach(() => {
    loggIO = new LoggIO({ format: 'APACHE_COMBINED' })
})

describe('Parser API', () => {

    describe('new LoggIO()', () => {
        test('instantiate with correct parameters', () => {
            expect(new LoggIO({ format: 'APACHE_COMBINED' })).toBeInstanceOf(LoggIO)
        })
        test('instantiate with wrong parameters should throw error', () => {
            expect(() => new LoggIO({ format: 'NON_EXISTING' })).toThrow()
        })
    })

    describe('.read(filepath)', () => {
        test('read existing file should parse logs correctly', done => {
            loggIO.read(logFile)
            loggIO.on('data', (data) => {
                expect(data.logs.length).toBe(8)
                done()
            })
        })
        test('read non-existing file should throw error', () => {
            expect(() => loggIO.read('./non-existing-file.log')).toThrow()
        })
    })

})

describe('Chainable stream data API', () => {

    beforeEach(() => {
        loggIO.read(logFile)
    })

    describe('.query()', () => {
        test('query should reset previous results', done => {
            loggIO.on('data', (data) => {
                data.query().limit(1)
                expect(data.query().results).toBe(data.logs)
                done()
            })
        })
        test('query should always comes first or throw error', done => {
            loggIO.on('data', (data) => {
                expect(() => data.limit(1)).toThrow()
                done()
            })
        })
    })

    describe('.unique([key])', () => {
        test('filtering unique occurences of existing key', done => {
            loggIO.on('data', (data) => {
                expect(data.query().unique('ip').results.length).toBe(4)
                done()
            })
        })
        test('filter unique occurences of non-existing key should return all', done => {
            loggIO.on('data', (data) => {
                expect(data.query().unique('unkown').results.length).toBe(8)
                done()
            })
        })
        test('filter unique occurences without parameters should remove duplicates', done => {
            loggIO.on('data', (data) => {
                expect(data.query().unique().results.length).toBe(7)
                done()
            })
        })
    })

    describe('.limit(max)', () => {
        test('limit results to 3', done => {
            loggIO.on('data', (data) => {
                expect(data.query().limit(3).results.length).toBe(3)
                done()
            })
        })
        test('limit results to 0 should throw error', done => {
            loggIO.on('data', (data) => {
                expect(() => data.query().limit(0)).toThrow()
                done()
            })
        })
    })

    describe('.sort(key)', () => {
        test('sort by ip should return 168.41.191.9 first', done => {
            loggIO.on('data', (data) => {
                expect(data.query().sort('ip').limit(1).results[0].ip).toBe('168.41.191.9')
                done()
            })
        })
        test('sort without key parameter should throw error', done => {
            loggIO.on('data', (data) => {
                expect(() => data.query().sort()).toThrow()
                done()
            })
        })
    })

    describe('.toJson()', () => {
        test('output query results in JSON (default)', done => {
            loggIO.on('data', (data) => {
                expect(data.query().toJson().length).toBe(8)
                done()
            })
        })
        test('output query results in JSON (chained)', done => {
            loggIO.on('data', (data) => {
                expect(data.query().limit(2).toJson().length).toBe(2)
                done()
            })
        })
    })

    describe('.count()', () => {
        test('output query results count (default)', done => {
            loggIO.on('data', (data) => {
                expect(data.query().count()).toBe(8)
                done()
            })
        })
        test('output query results count (chained)', done => {
            loggIO.on('data', (data) => {
                expect(data.query().limit(2).count()).toBe(2)
                done()
            })
        })
    })

})

describe('Reporting scenarios', () => {

    beforeEach(() => {
        loggIO.read(logFile)
    })

    test('unique IP addresses', done => {
        loggIO.on('data', (data) => {
            expect(data.query().unique('ip').count()).toBe(4)
            done()
        })
    })

    test('most visited urls', done => {
        loggIO.on('data', (data) => {
            expect(
                data
                    .query()
                    .sort('referer')
                    .unique('referer')
                    .limit(2)
                    .toJson()
                    .map(r => r.referer)
                    .join(',')
            ).toBe('/most-visited,/second-most-visited')
            done()
        })
    })

    test('most active IP addresses', done => {
        loggIO.on('data', (data) => {
            expect(
                data
                    .query()
                    .sort('ip')
                    .unique('ip')
                    .limit(2)
                    .toJson()
                    .map(r => r.ip)
                    .join(',')
            ).toBe('168.41.191.9,177.71.128.21')
            done()
        })
    })

})
