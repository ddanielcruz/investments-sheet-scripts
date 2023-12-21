import axios from 'axios'

import { getUserAgent } from '../helpers/http'

export type StatusInvestAsset = {
  name: string
  ticker: string
  type: string
}

export type StatusInvestAssetPrice = { price: number; date: string }

type StatusInvestResource = {
  url: string
  data: Record<string, unknown>
}

type BondPriceResponse = Array<{
  sellprice: number
  date: string
}>

type ETFPriceResponse = Array<{
  prices: Array<{
    price: number
    date: string
  }>
}>

export async function getAssetPrices(asset: StatusInvestAsset): Promise<StatusInvestAssetPrice[]> {
  const { url, data } = getAssetResource(asset)
  const response = await axios.post(url, data, {
    headers: {
      'User-Agent': getUserAgent(),
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
  })

  return parseResponseAssetPrices(response.data)
}

function getAssetResource(asset: StatusInvestAsset): StatusInvestResource {
  const { ticker, type } = asset

  switch (type) {
    case 'bond':
      return {
        url: 'https://statusinvest.com.br/category/bondprice',
        data: { ticker, type: 4 }
      }
    case 'etf':
      return {
        url: 'https://statusinvest.com.br/etf/tickerprice',
        data: { ticker, type: 4, 'currencies[]': 1 }
      }
    default:
      throw new Error(`Invalid asset type: ${type}`)
  }
}

function parseResponseAssetPrices(data: unknown): StatusInvestAssetPrice[] {
  if (isBondResponse(data)) {
    return data.map(({ sellprice, date }) => ({ price: sellprice, date }))
  }

  if (isETFResponse(data)) {
    return data[0].prices.map(({ price, date }) => ({ price, date: date.split(' ')[0] }))
  }

  throw new Error(`Invalid response`)
}

function isBondResponse(data: unknown): data is BondPriceResponse {
  return Array.isArray(data) && (data.length === 0 || 'sellprice' in data[0])
}

function isETFResponse(data: unknown): data is ETFPriceResponse {
  return Array.isArray(data) && data.length > 0 && 'prices' in data[0]
}
