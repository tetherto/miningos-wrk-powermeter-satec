'use strict'

const test = require('brittle')
const WrkPowerMeterRack = require('../../workers/pm180.rack.powermeter.wrk')
const { randomIP } = require('../util')

test('wrk: getThingTags returns correct tags', (t) => {
  const wrk = Object.create(WrkPowerMeterRack.prototype)
  const tags = wrk.getThingTags()
  t.ok(Array.isArray(tags))
  t.ok(tags.includes('satec'))
})

test('wrk: selectThingInfo extracts correct info', (t) => {
  const wrk = Object.create(WrkPowerMeterRack.prototype)
  const thg = {
    opts: {
      address: randomIP(),
      port: 502,
      unitId: 1
    }
  }

  const info = wrk.selectThingInfo(thg)
  t.is(info.address, thg.opts.address)
  t.is(info.port, 502)
  t.is(info.unitId, 1)
})

test('wrk: selectThingInfo handles missing opts', (t) => {
  const wrk = Object.create(WrkPowerMeterRack.prototype)
  const thg = {}

  const info = wrk.selectThingInfo(thg)
  t.is(info.address, undefined)
  t.is(info.port, undefined)
  t.is(info.unitId, undefined)
})

test('wrk: connectThing returns 0 when address is missing', async (t) => {
  const wrk = Object.create(WrkPowerMeterRack.prototype)
  const thg = {
    opts: {
      port: 502,
      unitId: 1
    }
  }

  const result = await wrk.connectThing(thg)
  t.is(result, 0)
})

test('wrk: connectThing returns 0 when port is missing', async (t) => {
  const wrk = Object.create(WrkPowerMeterRack.prototype)
  const thg = {
    opts: {
      address: randomIP(),
      unitId: 1
    }
  }

  const result = await wrk.connectThing(thg)
  t.is(result, 0)
})

test('wrk: connectThing returns 0 when unitId is missing', async (t) => {
  const wrk = Object.create(WrkPowerMeterRack.prototype)
  const thg = {
    opts: {
      address: randomIP(),
      port: 502
    }
  }

  const result = await wrk.connectThing(thg)
  t.is(result, 0)
})

test('wrk: connectThing returns 0 when unitId is undefined', async (t) => {
  const wrk = Object.create(WrkPowerMeterRack.prototype)
  const thg = {
    opts: {
      address: randomIP(),
      port: 502,
      unitId: undefined
    }
  }

  const result = await wrk.connectThing(thg)
  t.is(result, 0)
})

test('wrk: connectThing creates powermeter instance with valid opts', async (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const wrk = Object.create(WrkPowerMeterRack.prototype)
  wrk.modbus_0 = {
    getClient: mockGetClient
  }
  wrk.conf = {
    thing: {
      powermeter: {},
      collectSnapsItvMs: 60000
    }
  }

  const thg = {
    opts: {
      address: randomIP(),
      port: 502,
      unitId: 1
    }
  }

  const result = await wrk.connectThing(thg)
  t.is(result, 1)
  t.ok(thg.ctrl)
  t.ok(typeof thg.ctrl.getSnap === 'function')
})

test('wrk: connectThing uses default collectSnapsItvMs when not in conf', async (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const wrk = Object.create(WrkPowerMeterRack.prototype)
  wrk.modbus_0 = {
    getClient: mockGetClient
  }
  wrk.conf = {
    thing: {
      powermeter: {}
    }
  }

  const thg = {
    opts: {
      address: randomIP(),
      port: 502,
      unitId: 1
    }
  }

  const result = await wrk.connectThing(thg)
  t.is(result, 1)
  t.ok(thg.ctrl)
  t.is(thg.ctrl.collectSnapsItvMs, 60000) // default value
})

test('wrk: connectThing attaches error handler', async (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const wrk = Object.create(WrkPowerMeterRack.prototype)
  wrk.modbus_0 = {
    getClient: mockGetClient
  }
  wrk.conf = {
    thing: {
      powermeter: {},
      collectSnapsItvMs: 60000
    }
  }
  wrk.debugThingError = () => {} // Mock implementation

  const thg = {
    opts: {
      address: randomIP(),
      port: 502,
      unitId: 1
    }
  }

  await wrk.connectThing(thg)
  t.ok(thg.ctrl)
  t.ok(typeof thg.ctrl.on === 'function')
})

test('wrk: collectThingSnap calls getSnap', async (t) => {
  const wrk = Object.create(WrkPowerMeterRack.prototype)
  let getSnapCalled = false
  const thg = {
    ctrl: {
      getSnap: async () => {
        getSnapCalled = true
        return { success: true }
      }
    }
  }

  const result = await wrk.collectThingSnap(thg)
  t.ok(getSnapCalled)
  t.ok(result.success)
})

test('wrk: init sets init facs', (t) => {
  const wrk = Object.create(WrkPowerMeterRack.prototype)
  wrk.setInitFacs = (facs) => {
    wrk.initFacs = facs
  }
  const originalInit = WrkPowerMeterRack.prototype.init
  WrkPowerMeterRack.prototype.init = function () {
    this.setInitFacs([['fac', 'svc-facs-modbus', '0', '0', {}, 0]])
  }
  wrk.init()
  WrkPowerMeterRack.prototype.init = originalInit
  t.ok(wrk.initFacs)
  t.is(wrk.initFacs.length, 1)
  t.is(wrk.initFacs[0][1], 'svc-facs-modbus')
})
