const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Relipa NFT', async () => {
  let [accountA, accountB, accountC, accountD] = []
  let treasure
  let nft
  let marketplace
  let address0 = '0x0000000000000000000000000000000000000000'
  let uri = 'google.com/'
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
  describe('common', async () => {
    it('getTreasureType should return right value', async () => {
      expect(await treasure.getTreasureType()).to.be.equal(1)
    })
    it('balance of account A,B,C should be 0', async () => {
      expect(await treasure.getBalanceOf(accountA.address)).to.be.equal(0)
      expect(await treasure.getBalanceOf(accountB.address)).to.be.equal(0)
      expect(await treasure.getBalanceOf(accountC.address)).to.be.equal(0)
    })
    it('getURI should return right value', async () => {
      expect(await treasure.getURI()).to.be.equal(uri)
    })
  })
  describe('setURI', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
  describe('', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
  describe('', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
  describe('', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
  describe('', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
  describe('', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
  describe('', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
})
