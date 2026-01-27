'use strict'

const WrkRack = require('miningos-tpl-wrk-powermeter/workers/rack.powermeter.wrk')
const PM180PowerMeter = require('./lib/powermeter')

class WrkPowerMeterRack extends WrkRack {
  init () {
    super.init()

    this.setInitFacs([['fac', 'svc-facs-modbus', '0', '0', {}, 0]])
  }

  getThingType () {
    return super.getThingType() + '-satec-pm180'
  }

  getThingTags () {
    return ['satec']
  }

  async collectThingSnap (thg) {
    return thg.ctrl.getSnap()
  }

  selectThingInfo (thg) {
    return {
      address: thg.opts?.address,
      port: thg.opts?.port,
      unitId: thg.opts?.unitId
    }
  }

  async connectThing (thg) {
    if (!thg.opts.address || !thg.opts.port || thg.opts.unitId === undefined) {
      return 0
    }

    const powermeter = new PM180PowerMeter({
      ...thg.opts,
      getClient: this.modbus_0.getClient.bind(this.modbus_0),
      conf: this.conf.thing.powermeter || {},
      collectSnapsItvMs: this.conf.thing.collectSnapsItvMs || 60000
    })

    powermeter.on('error', (e) => {
      this.debugThingError(thg, e)
    })

    thg.ctrl = powermeter

    return 1
  }
}

module.exports = WrkPowerMeterRack
