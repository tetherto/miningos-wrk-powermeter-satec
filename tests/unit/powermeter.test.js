'use strict'

const test = require('brittle')
const PM180PowerMeter = require('../../workers/lib/powermeter')
const constants = require('../../workers/lib/constants')
const { randomIP } = require('../util')

test('powermeter: constructor throws error when getClient is missing', (t) => {
  t.exception(() => {
    const pm = new PM180PowerMeter({})
    return pm
  }, 'ERR_NO_CLIENT')
})

test('powermeter: constructor initializes with valid options', (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  t.ok(pm.client)
  t.is(pm.collectSnapsItvMs, 60000)
  t.ok(Array.isArray(pm.last15mPowerBuffer))
  t.is(pm.bufferIndex, 0)
})

test('powermeter: constructor calculates buffer size correctly', (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const collectSnapsItvMs = 60000 // 1 minute
  const expectedBufferSize = Math.floor((15 * 60 * 1000) / collectSnapsItvMs) // 15 minutes

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs
  })

  t.is(pm.last15mPowerBufferSize, expectedBufferSize)
  t.is(pm.last15mPowerBuffer.length, expectedBufferSize)
})

test('powermeter: close calls client.end', (t) => {
  let endCalled = false
  const mockGetClient = () => ({
    end: () => { endCalled = true },
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  pm.close()
  t.ok(endCalled)
})

test('powermeter: _storePowerInBuffer stores power value', (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  pm._storePowerInBuffer(1000)
  t.is(pm.last15mPowerBuffer[0], 1000)
  t.is(pm.bufferIndex, 1)

  pm._storePowerInBuffer(2000)
  t.is(pm.last15mPowerBuffer[1], 2000)
  t.is(pm.bufferIndex, 2)
})

test('powermeter: _storePowerInBuffer wraps around buffer', (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  // Fill buffer to capacity (this will make bufferIndex wrap to 0)
  for (let i = 0; i < pm.last15mPowerBufferSize; i++) {
    pm._storePowerInBuffer(i * 100)
  }

  t.is(pm.bufferIndex, 0)
  pm._storePowerInBuffer(9999)
  t.is(pm.last15mPowerBuffer[0], 9999)
  t.is(pm.bufferIndex, 1)
})

test('powermeter: _calculate15MinAvg returns 0 for empty buffer', (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  t.is(pm._calculate15MinAvg(), 0)
})

test('powermeter: _calculate15MinAvg calculates average correctly', (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  pm._storePowerInBuffer(1000)
  pm._storePowerInBuffer(2000)
  pm._storePowerInBuffer(3000)

  const avg = pm._calculate15MinAvg()
  t.is(avg, 2000)
})

test('powermeter: _calculate15MinAvg ignores null values', (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  pm._storePowerInBuffer(1000)
  pm._storePowerInBuffer(2000)

  const avg = pm._calculate15MinAvg()
  t.is(avg, 1500) // (1000 + 2000) / 2
})

test('powermeter: _prepInstantaneousValues throws error for invalid data', (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  t.exception(() => {
    pm._prepInstantaneousValues(null)
  }, 'ERR_DATA_INVALID')

  t.exception(() => {
    pm._prepInstantaneousValues('not a buffer')
  }, 'ERR_DATA_INVALID')
})

test('powermeter: _prepInstantaneousValues throws error for insufficient data', (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  const shortBuffer = Buffer.alloc(20)
  t.exception(() => {
    pm._prepInstantaneousValues(shortBuffer)
  }, 'ERR_DATA_INSUFFICIENT')
})

test('powermeter: _prepInstantaneousValues processes valid data correctly', (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  // Create a buffer with test data
  const data = Buffer.alloc(38)
  // Set some test values
  data.writeInt16BE(5000, 0) // voltage_v1_v12_v
  data.writeUInt16BE(5000, 2) // voltage_v2_v23_v
  data.writeInt16BE(5000, 4) // voltage_v3_v31_v
  data.writeInt16BE(1000, 6) // current_i1_a
  data.writeUInt16BE(1000, 8) // current_i2_a
  data.writeInt16BE(1000, 10) // current_i3_a
  data.writeInt16BE(5000, 12) // power_factor_l1
  data.writeInt16BE(5000, 14) // power_factor_l2
  data.writeInt16BE(5000, 16) // power_factor_l3
  data.writeInt16BE(5000, 20) // real_import_power_w
  data.writeUInt16BE(5000, 22) // reactive_power_k_var
  data.writeInt16BE(5000, 24) // apparent_import_power_kva
  data.writeUInt16BE(100, 26) // voltage_1_2_thd
  data.writeUInt16BE(100, 28) // voltage_2_3_thd
  data.writeUInt16BE(100, 30) // voltage_3_1_thd
  data.writeUInt16BE(100, 32) // current_i1_thd
  data.writeUInt16BE(100, 34) // current_i2_thd
  data.writeUInt16BE(100, 36) // current_i3_thd

  const result = pm._prepInstantaneousValues(data)

  t.ok(result)
  t.ok(typeof result.voltage_v1_v12_v === 'number')
  t.ok(typeof result.voltage_v2_v23_v === 'number')
  t.ok(typeof result.voltage_v3_v31_v === 'number')
  t.ok(typeof result.current_i1_a === 'number')
  t.ok(typeof result.current_i2_a === 'number')
  t.ok(typeof result.current_i3_a === 'number')
  t.ok(typeof result.power_factor_l1 === 'number')
  t.ok(typeof result.power_factor_l2 === 'number')
  t.ok(typeof result.power_factor_l3 === 'number')
  t.ok(typeof result.real_import_power_w === 'number')
  t.ok(typeof result.reactive_power_k_var === 'number')
  t.ok(typeof result.apparent_import_power_kva === 'number')
  t.ok(typeof result.voltage_1_2_thd === 'number')
  t.ok(typeof result.voltage_2_3_thd === 'number')
  t.ok(typeof result.voltage_3_1_thd === 'number')
  t.ok(typeof result.current_i1_thd === 'number')
  t.ok(typeof result.current_i2_thd === 'number')
  t.ok(typeof result.current_i3_thd === 'number')
})

test('powermeter: _prepInstantaneousValues applies Math.max to ensure non-negative values', (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  // Create a buffer with negative values
  const data = Buffer.alloc(38)
  data.writeInt16BE(-1000, 0) // voltage_v1_v12_v (negative)
  data.writeInt16BE(-1000, 6) // current_i1_a (negative)
  data.writeInt16BE(-1000, 20) // real_import_power_w (negative)

  const result = pm._prepInstantaneousValues(data)

  t.ok(result.voltage_v1_v12_v >= 0)
  t.ok(result.current_i1_a >= 0)
  t.ok(result.real_import_power_w >= 0)
})

test('powermeter: _prepInstantaneousValues converts power from kW to W', (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  const data = Buffer.alloc(38)
  // Set a test raw value (in the middle of the range)
  const testRawValue = 5000
  data.writeInt16BE(testRawValue, 20)

  const result = pm._prepInstantaneousValues(data)
  const expectedKw = (testRawValue * constants.POWER_MULTIPLIER) + constants.ENG_LO
  const expectedW = Math.max(expectedKw, 0) * 1000

  // Verify the conversion multiplies by 1000 (kW to W)
  t.is(result.real_import_power_w, expectedW)
  t.ok(result.real_import_power_w >= 0)
})

test('powermeter: readValues is a function', (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: () => Promise.resolve(Buffer.alloc(0))
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  t.ok(typeof pm.readValues === 'function')
})

test('powermeter: _prepSnap returns correct structure', async (t) => {
  const mockGetClient = () => ({
    end: () => {},
    read: (functionCode, address, length) => {
      return Promise.resolve(Buffer.alloc(length * 2))
    }
  })

  const pm = new PM180PowerMeter({
    getClient: mockGetClient,
    address: randomIP(),
    port: 502,
    unitId: 1,
    timeout: 5000,
    collectSnapsItvMs: 60000
  })

  // Create valid data buffer
  const data = Buffer.alloc(38)
  data.writeInt16BE(5000, 0)
  data.writeUInt16BE(5000, 2)
  data.writeInt16BE(5000, 4)
  data.writeInt16BE(1000, 6)
  data.writeUInt16BE(1000, 8)
  data.writeInt16BE(1000, 10)
  data.writeInt16BE(5000, 12)
  data.writeInt16BE(5000, 14)
  data.writeInt16BE(5000, 16)
  data.writeInt16BE(5000, 20)
  data.writeUInt16BE(5000, 22)
  data.writeInt16BE(5000, 24)
  data.writeUInt16BE(100, 26)
  data.writeUInt16BE(100, 28)
  data.writeUInt16BE(100, 30)
  data.writeUInt16BE(100, 32)
  data.writeUInt16BE(100, 34)
  data.writeUInt16BE(100, 36)

  pm.cache = data
  const result = await pm._prepSnap(true)

  t.ok(result.success)
  t.ok(result.stats)
  t.ok(typeof result.stats.power_w === 'number')
  t.ok(typeof result.stats.tension_v === 'number')
  t.ok(result.stats.powermeter_specific)
  t.ok(result.stats.powermeter_specific.instantaneous_values)
  t.ok(result.stats.powermeter_specific.historical_values)
  t.ok(typeof result.stats.powermeter_specific.historical_values.real_import_power_w_last15m_avg === 'number')
  t.ok(result.config)
})
