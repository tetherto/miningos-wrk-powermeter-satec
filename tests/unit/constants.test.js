'use strict'

const test = require('brittle')
const constants = require('../../workers/lib/constants')

test('constants: POWER_MULTIPLIER calculation', (t) => {
  const expected = (108682.56 - (-108682.56)) / (9999 - 0)
  t.is(constants.POWER_MULTIPLIER, expected)
})

test('constants: POWER_FACTOR_MULTIPLIER calculation', (t) => {
  const expected = (1 - (-1)) / 9999
  t.is(constants.POWER_FACTOR_MULTIPLIER, expected)
})

test('constants: VOLTAGE_MULTIPLIER calculation', (t) => {
  const expected = 45360 / 9999
  t.is(constants.VOLTAGE_MULTIPLIER, expected)
})

test('constants: CURRENT_MULTIPLIER calculation', (t) => {
  const expected = 1198 / 9999
  t.is(constants.CURRENT_MULTIPLIER, expected)
})

test('constants: THD_MULTIPLIER value', (t) => {
  t.is(constants.THD_MULTIPLIER, 0.001)
})

test('constants: ENG_LO value', (t) => {
  t.is(constants.ENG_LO, -108682.56)
})

test('constants: LO_ENG value', (t) => {
  t.is(constants.LO_ENG, -1)
})

test('constants: RAW_HI value', (t) => {
  t.is(constants.RAW_HI, 9999)
})
