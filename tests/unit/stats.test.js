'use strict'

const test = require('brittle')
const libStats = require('../../workers/lib/stats')

test('stats: powermeter specs are defined', (t) => {
  t.ok(libStats.specs)
  t.ok(libStats.specs.powermeter)
  t.ok(libStats.specs.powermeter.ops)
})

test('stats: site_power_w operation is configured correctly', (t) => {
  const sitePowerOp = libStats.specs.powermeter.ops.site_power_w
  t.ok(sitePowerOp)
  t.is(sitePowerOp.op, 'sum')
  t.is(sitePowerOp.src, 'last.snap.stats.power_w')
  t.ok(typeof sitePowerOp.filter === 'function')
})

test('stats: site_power_w filter returns true for site entries', (t) => {
  const filter = libStats.specs.powermeter.ops.site_power_w.filter
  const entry = {
    info: {
      pos: 'site'
    }
  }
  t.ok(filter(entry))
})

test('stats: site_power_w filter returns false for non-site entries', (t) => {
  const filter = libStats.specs.powermeter.ops.site_power_w.filter
  const entry = {
    info: {
      pos: 'rack-1'
    }
  }
  t.is(filter(entry), false)
})

test('stats: site_power_w filter returns false for missing info', (t) => {
  const filter = libStats.specs.powermeter.ops.site_power_w.filter
  const entry = {}
  t.is(filter(entry), false)
})

test('stats: power_w_container_group_sum operation is configured correctly', (t) => {
  const op = libStats.specs.powermeter.ops.power_w_container_group_sum
  t.ok(op)
  t.is(op.op, 'group_sum')
  t.is(op.src, 'last.snap.stats.power_w')
  t.ok(typeof op.group === 'function')
})

test('stats: powermeter_specific_stats_group operation is configured correctly', (t) => {
  const op = libStats.specs.powermeter.ops.powermeter_specific_stats_group
  t.ok(op)
  t.is(op.op, 'group_multiple_stats')
  t.ok(Array.isArray(op.srcs))
  t.is(op.srcs.length, 1)
  t.is(op.srcs[0].name, 'real_import_power_w_last15m_avg')
  t.is(op.srcs[0].src, 'last.snap.stats.powermeter_specific.historical_values.real_import_power_w_last15m_avg')
  t.ok(typeof op.group === 'function')
  t.ok(typeof op.filter === 'function')
})

test('stats: powermeter_specific_stats_group filter returns false for missing snap', (t) => {
  const filter = libStats.specs.powermeter.ops.powermeter_specific_stats_group.filter
  const entry = {}
  t.is(filter(entry), false)
})

test('stats: powermeter_specific_stats_group filter returns false for missing last', (t) => {
  const filter = libStats.specs.powermeter.ops.powermeter_specific_stats_group.filter
  const entry = {
    last: {}
  }
  t.is(filter(entry), false)
})

test('stats: powermeter_specific_stats_group filter returns false for missing stats', (t) => {
  const filter = libStats.specs.powermeter.ops.powermeter_specific_stats_group.filter
  const entry = {
    last: {
      snap: {}
    }
  }
  t.is(filter(entry), false)
})

test('stats: powermeter_specific_stats_group filter handles offline entries', (t) => {
  const filter = libStats.specs.powermeter.ops.powermeter_specific_stats_group.filter
  const libUtils = require('miningos-tpl-wrk-powermeter/workers/lib/utils')

  const originalIsOffline = libUtils.isOffline
  libUtils.isOffline = () => true

  const entry = {
    last: {
      snap: {
        stats: {}
      }
    }
  }

  const result = filter(entry)
  t.is(result, false)

  libUtils.isOffline = originalIsOffline
})

test('stats: powermeter_specific_stats_group filter returns true for valid online entries', (t) => {
  const filter = libStats.specs.powermeter.ops.powermeter_specific_stats_group.filter
  const libUtils = require('miningos-tpl-wrk-powermeter/workers/lib/utils')

  const originalIsOffline = libUtils.isOffline
  libUtils.isOffline = () => false

  const entry = {
    last: {
      snap: {
        stats: {
          powermeter_specific: {
            historical_values: {
              real_import_power_w_last15m_avg: 1000
            }
          }
        }
      }
    }
  }

  const result = filter(entry)
  t.ok(result)

  libUtils.isOffline = originalIsOffline
})

test('stats: powermeter_default ops are inherited', (t) => {
  t.ok(libStats.specs.powermeter.ops)
  const allOps = Object.keys(libStats.specs.powermeter.ops)
  t.ok(allOps.length > 0)
})
