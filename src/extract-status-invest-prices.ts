import fs from 'node:fs'
import { format } from '@fast-csv/format'
import dayjs from 'dayjs'
import dayjsCustomParseFormat from 'dayjs/plugin/customParseFormat'

import { getAssetPrices } from './services/status-invest'
import assetsData from '../data/status-invest-assets.json'

dayjs.extend(dayjsCustomParseFormat)

const MINIMUM_DATE = new Date('2021-01-01')
const groupedPricesByDate: Record<string, Record<string, number>> = {}
const assetSheetKeys: string[] = []

// Fetch asset prices and group them by date
for (const asset of assetsData) {
  assetSheetKeys.push(asset.name)
  const assetPrices = await getAssetPrices(asset)

  for (const assetPrice of assetPrices) {
    const date = dayjs(assetPrice.date.trim(), 'DD/MM/YY')
    if (date.isBefore(MINIMUM_DATE)) {
      continue
    }

    const key = date.format('YYYY-MM-DD')
    if (!groupedPricesByDate[key]) {
      groupedPricesByDate[key] = {}
    }

    groupedPricesByDate[key][asset.name] = assetPrice.price
  }
}

// Write prices to CSV file
assetSheetKeys.sort()
const csv = format({ headers: ['Data', ...assetSheetKeys] })
const filename = `tmp/status-invest-asset-prices-${dayjs().format('YYYY-MM-DD')}.csv`
csv.pipe(fs.createWriteStream(filename))

Object.keys(groupedPricesByDate)
  .sort()
  .forEach(key => {
    const date = dayjs(key, 'YYYY-MM-DD')
    const prices = assetSheetKeys.map(asset => {
      const price = groupedPricesByDate[key][asset]
      if (!price) {
        return null
      }

      return price.toString().replace('.', ',')
    })

    csv.write([date.format('DD/MM/YYYY'), ...prices])
  })
