'use strict'
var path = require('path')
var fs = require('graceful-fs')
var test = require('tap').test
var Tacks = require('tacks')
var File = Tacks.File
var Dir = Tacks.Dir
var common = require('../common-tap.js')

var testdir = path.join(__dirname, path.basename(__filename, '.js'))

var fixture = new Tacks(
  Dir({
    mods: Dir({
      mod1: Dir({
        'package.json': File({
          name: 'mod1',
          version: '1.0.0'
        })
      })
    }),
    'npm-shrinkwrap.json': File({
      name: 'shrinkwrap-default-arg-ver',
      version: '1.0.0',
      dependencies: {
        mod1: {
          version: '1.0.0',
          from: 'mods/mod1',
          resolved: 'file:mods/mod1'
        }
      }
    }),
    'package.json': File({
      name: 'shrinkwrap-default-arg-ver',
      version: '1.0.0',
      dependencies: {
        mod1: '1.0.0'
      }
    })
  })
)

function setup () {
  fixture.create(testdir)
}

function cleanup () {
  fixture.remove(testdir)
}

test('setup', function (t) {
  cleanup()
  setup()
  t.end()
})

function exists (file) {
  try {
    fs.statSync(file)
    return true
  } catch (ex) {
    return false
  }
}

test('shrinkwrap-default-arg-version', function (t) {
  // We don't actually setup the mock registry here because we're happy
  // having ANY registry access fail.
  var config = [
    '--loglevel=error',
    '--registry=' + common.registry
  ]
  // When this feature was malfunctioning npm would select the version of
  // `mod1` from the `package.json` instead of the `npm-shrinkwrap.json`,
  // which in this case would mean trying the registry instead of installing
  // from a local folder.
  common.npm(config.concat(['install', 'mod1']), {cwd: testdir}, function (err, code, stdout, stderr) {
    if (err) throw err
    t.comment(stdout.trim())
    t.comment(stderr.trim())
    t.is(code, 0, 'installed ok')
    t.ok(exists(path.join(testdir, 'node_modules', 'mod1')), 'mod1 installed')
    t.end()
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})
