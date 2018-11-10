import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects'

var Eth = require('ethjs')

/*
 * Initialization
 */

export function * initializeWeb3 ({ options }) {
  try {
    var web3 = {}

    if (window.ethereum) {
      const { ethereum } = window
      web3 = new Eth(ethereum)
      try {
        yield call(ethereum.enable)

        web3.cacheSendTransaction = txObject =>
          put({ type: 'SEND_WEB3_TX', txObject, stackId, web3 })

        yield put({ type: 'WEB3_INITIALIZED' })

        return web3
      } catch (error) {
        // User denied account access...
        console.log(error)
      }
    }

    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    else if (typeof window.web3 !== 'undefined') {
      // Use Mist/MetaMask's provider.
      web3 = new Eth(window.web3.currentProvider)
      web3.cacheSendTransaction = txObject =>
        put({ type: 'SEND_WEB3_TX', txObject, stackId, web3 })

      console.log('Injected web3 detected.')

      yield put({ type: 'WEB3_INITIALIZED' })

      return web3
    } else {
      if (options.fallback) {
        // Attempt fallback if no web3 injection.
        console.log('No web3 instance injected, using fallback.')

        switch (options.fallback.type) {
          case 'ws':
            var provider = new Eth.HttpProvider(
              options.fallback.url
            )
            web3 = new Eth(provider)

            // Attach drizzle functions
            web3['cacheSendTransaction'] = txObject =>
              put({ type: 'SEND_WEB3_TX', txObject, stackId, web3 })

            yield put({ type: 'WEB3_INITIALIZED' })

            return web3

            break
          default:
            // Invalid options; throw.
            throw 'Invalid web3 fallback provided.'
        }
      }

      // Out of web3 options; throw.
      throw 'Cannot find injected web3 or valid fallback.'
    }
  } catch (error) {
    yield put({ type: 'WEB3_FAILED', error })
    console.error('Error intializing web3:')
    console.error(error)
  }
}

/*
 * Network ID
 */

export function * getNetworkId ({ web3 }) {
  try {
    const networkId = yield call(web3.net_version)

    yield put({ type: 'NETWORK_ID_FETCHED', networkId })

    return networkId
  } catch (error) {
    yield put({ type: 'NETWORK_ID_FAILED', error })

    console.error('Error fetching network ID:')
    console.error(error)
  }
}

function * web3Saga () {
  yield takeLatest('NETWORK_ID_FETCHING', getNetworkId)
}

export default web3Saga