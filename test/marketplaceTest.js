const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Market Place', async () => {
  let [accountA, accountB, accountC, accountD] = []
  let treasure
  let nft
  let marketplace
  let address0 = '0x0000000000000000000000000000000000000000'
  let provider
  beforeEach(async () => {
    provider = new ethers.providers.JsonRpcProvider()
    ;[accountA, accountB, accountC, accountD] = await ethers.getSigners()
    const NFT = await ethers.getContractFactory('RelipaNFT')
    nft = await NFT.deploy('9999', '2')
    await nft.deployed()

    const Treasure = await ethers.getContractFactory('RelipaTreasure')
    treasure = await Treasure.deploy(uri, nft.address)
    await treasure.deployed()

    const setOperator = await nft.addOperator(treasure.address)
    await setOperator.wait()

    const MarketPlace = await ethers.getContractFactory('Marketplace')
    marketplace = await MarketPlace.deploy(nft.address, treasure.address, 2, 2, accountD.address)
    await marketplace.deployed()
  })

  describe('', async () => {})
  describe('', async () => {})
  describe('', async () => {})
  describe('', async () => {})
  describe('', async () => {})
  describe('', async () => {})
  describe('', async () => {})
})
