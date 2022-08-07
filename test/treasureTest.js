const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Relipa NFT', function () {
  let [accountA, accountB, accountC, accountD] = []
  let treasure
  let nft
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
    const setOperator1 = await nft.addOperator1(treasure.address)
    await setOperator1.wait()
  })
})
