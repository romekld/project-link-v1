import { describe, expect, it } from 'vitest'
import type { BoundaryCollection } from './types'
import { buildIntelligenceFixtures, getAvailableLayersForRole } from './fixtures'

const sampleCollection: BoundaryCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        fid: 1,
        ADM4_EN: 'Alpha',
        ADM4_PCODE: 'ALPHA',
        ADM4_REF: null,
        ADM3_EN: 'City of Dasmarinas',
        ADM3_PCODE: 'PH0402106',
        ADM2_EN: 'Cavite',
        ADM2_PCODE: 'PH04021',
        ADM1_EN: 'Region IV-A',
        ADM1_PCODE: 'PH04',
        ADM0_EN: 'Philippines',
        ADM0_PCODE: 'PH',
        date: '2022-11-09',
        validOn: '2023-11-06',
        validTo: null,
        Shape_Leng: 1,
        Shape_Area: 1,
        AREA_SQKM: 1,
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[[
          [120.9, 14.3],
          [120.91, 14.3],
          [120.91, 14.31],
          [120.9, 14.31],
          [120.9, 14.3],
        ]]],
      },
    },
    {
      type: 'Feature',
      properties: {
        fid: 2,
        ADM4_EN: 'Beta',
        ADM4_PCODE: 'BETA',
        ADM4_REF: null,
        ADM3_EN: 'City of Dasmarinas',
        ADM3_PCODE: 'PH0402106',
        ADM2_EN: 'Cavite',
        ADM2_PCODE: 'PH04021',
        ADM1_EN: 'Region IV-A',
        ADM1_PCODE: 'PH04',
        ADM0_EN: 'Philippines',
        ADM0_PCODE: 'PH',
        date: '2022-11-09',
        validOn: '2023-11-06',
        validTo: null,
        Shape_Leng: 1,
        Shape_Area: 1,
        AREA_SQKM: 1,
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[[
          [120.92, 14.32],
          [120.93, 14.32],
          [120.93, 14.33],
          [120.92, 14.33],
          [120.92, 14.32],
        ]]],
      },
    },
  ],
}

const cho2Collection: BoundaryCollection = {
  type: 'FeatureCollection',
  features: [sampleCollection.features[0]],
}

describe('buildIntelligenceFixtures', () => {
  it('hydrates map fixtures with snapshots and bounds', () => {
    const fixtures = buildIntelligenceFixtures(sampleCollection, cho2Collection)

    expect(fixtures.dasmarinas.features).toHaveLength(2)
    expect(fixtures.cho2.features).toHaveLength(1)
    expect(fixtures.diseaseHeat.features).toHaveLength(1)
    expect(fixtures.snapshots.ALPHA?.inCho2Scope).toBe(true)
    expect(fixtures.snapshots.BETA?.inCho2Scope).toBe(false)
    expect(fixtures.initialBounds[0][0]).toBeLessThan(fixtures.initialBounds[1][0])
  })
})

describe('getAvailableLayersForRole', () => {
  it('limits dso controls to disease-focused layers', () => {
    expect(getAvailableLayersForRole('dso')).toEqual(['scope', 'diseaseHeat'])
    expect(getAvailableLayersForRole('phn')).toEqual(['choropleth', 'scope', 'diseaseHeat'])
  })
})
