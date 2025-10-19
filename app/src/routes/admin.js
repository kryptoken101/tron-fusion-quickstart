const express = require('express')
const router = express.Router()
const chalk = require('chalk')
const wait = require('../utils/wait')
const _ = require('lodash')
const accountsGeneration = require('../utils/accountsGeneration')
const tronWebBuilder = require('../utils/tronWebBuilder')
const fs = require('fs')
const path = require('path')
const config = require('../config')

// Load accounts.json safely
let testingAccounts
const accountsPath = '/tron/app/conf/accounts.json'
try {
  if (fs.existsSync(accountsPath)) {
    testingAccounts = require(accountsPath)
    console.log(chalk.green('Loaded accounts.json successfully'))
  } else {
    console.warn(chalk.yellow('accounts.json not found, will generate dynamically'))
    testingAccounts = { privateKeys: [], more: [], mnemonic: '', hdPath: '' }
  }
} catch (err) {
  console.error(chalk.red('Error loading accounts.json:'), err)
  testingAccounts = { privateKeys: [], more: [], mnemonic: '', hdPath: '' }
}

let formattedTestingAccounts = []

function flatAccounts() {
  if (!testingAccounts || !testingAccounts.privateKeys) {
    console.warn(chalk.yellow('testingAccounts.privateKeys is undefined'))
    return []
  }
  let privateKeys = testingAccounts.privateKeys || []
  if (Array.isArray(testingAccounts.more)) {
    for (let j = 0; j < testingAccounts.more.length; j++) {
      privateKeys = privateKeys.concat(testingAccounts.more[j].privateKeys || [])
    }
  }
  return privateKeys
}

async function getBalances() {
  const tronWeb = tronWebBuilder()
  const balances = []
  const privateKeys = flatAccounts()

  for (let i = 0; i < privateKeys.length; i++) {
    let address = tronWeb.address.fromPrivateKey(privateKeys[i])
    balances[i] = await tronWeb.trx.getBalance(address)
  }
  return balances
}

let trxSent = {}

async function verifyAccountsBalance(options) {
  const env = config.getEnv()
  options = options ? _.defaults(options, env) : env
  const tronWeb = tronWebBuilder()

  console.log(chalk.gray("...\nLoading the accounts and waiting for the node to mine the transactions..."))

  const amount = options.defaultBalance || 10000
  const balances = []
  let ready = 0
  let count = 1
  let accounts = (testingAccounts.more && testingAccounts.more.length > 0) 
    ? testingAccounts.more[testingAccounts.more.length - 1]
    : testingAccounts
  let privateKeys = accounts.privateKeys || []

  while (true) {
    console.log(chalk.gray(`(${count++}) Waiting for receipts...`))
    for (let i = 0; i < privateKeys.length; i++) {
      let address = tronWeb.address.fromPrivateKey(privateKeys[i])
      if (privateKeys[i] !== tronWeb.defaultPrivateKey && !trxSent[address]) {
        let result = await tronWeb.trx.sendTransaction(address, tronWeb.toSun(amount))
        if (result && result.result) {
          console.log(chalk.gray(`Sending ${amount} TRX to ${address}`))
          trxSent[address] = true
        }
      } else if (!balances[i]) {
        let balance = await tronWeb.trx.getBalance(address)
        if (balance > 0) {
          balances[i] = balance
          ready++
        }
      }
    }
    if (ready < privateKeys.length) await wait(3)
    else break
  }

  console.log(chalk.gray('Done.\n'))
  return balances
}

async function formatAccounts(balances, format) {
  const tronWeb = tronWebBuilder()
  const privateKeys = flatAccounts()
  formattedTestingAccounts = 'Available Accounts\n==================\n\n'

  for (let i = 0; i < privateKeys.length; i++) {
    let address = tronWeb.address.fromPrivateKey(privateKeys[i])
    formattedTestingAccounts += `(${i}) ${format === 'hex' ? tronWeb.address.toHex(address) : address} (${tronWeb.fromSun(balances[i])} TRX)\n${format === 'all' ? '    ' + tronWeb.address.toHex(address) + '\n' : ''}`
  }

  formattedTestingAccounts += '\nPrivate Keys\n==================\n\n'
  for (let i = 0; i < privateKeys.length; i++) {
    formattedTestingAccounts += `(${i}) ${privateKeys[i]}\n`
  }

  formattedTestingAccounts += '\nHD Wallet\n==================\n' +
    'Mnemonic:      ' + (testingAccounts.mnemonic || '') + '\n' +
    'Base HD Path:  ' + (testingAccounts.hdPath || '') + '{account_index}\n'

  return
}

function logRouter(route) {
  console.log(chalk.bold(chalk.cyan('\n\nADMIN'), `/admin/${route}`))
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Accept')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  return res
}

// Routes
router.get('/accounts', async function (req, res) {
  logRouter('accounts')
  const balances = await getBalances()
  await formatAccounts(balances, req.query.format)
  res.set('Content-Type', 'text/plain').send(formattedTestingAccounts)
})

router.get('/set-env', async function (req, res) {
  logRouter('set-env')
  const env = config.getEnv(req.query)
  for (let key in env) process.env[key] = env[key]
  console.log('New env: ', config.getEnv())
  res.set('Content-Type', 'text/plain').send('Environment variable updated')
})

router.get('/accounts-json', function (req, res) {
  logRouter('accounts-json')
  res = setCors(res)
  res.json(testingAccounts)
})

router.get('/accounts-generation', async function (req, res) {
  logRouter('accounts-generation')
  testingAccounts = await accountsGeneration()
  await verifyAccountsBalance()
  const balances = await getBalances()
  await formatAccounts(balances)
  console.log(formattedTestingAccounts)
  res.send()
})

router.get('/temporary-accounts-generation', async function (req, res) {
  logRouter('temporary-accounts-generation')
  const options = req.query || {}
  options.addAccounts = true
  testingAccounts = await accountsGeneration(options)
  await verifyAccountsBalance()
  const balances = await getBalances()
  await formatAccounts(balances)
  res = setCors(res)
  res.set('Content-Type', 'text/plain').send(formattedTestingAccounts)
})

router.get('/', function (req, res) {
  res.send('Welcome to Tron Quickstart ' + require('../../package').version)
})

module.exports = router

