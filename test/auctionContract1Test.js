const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Auction Contract 1', async () => {
  let [accountA, accountB, accountC, accountD] = []
  let nft
  let hdntoken
  let treasure
  let marketplace
  let auctionContract1
  let address0 = '0x0000000000000000000000000000000000000000'
  let uri = 'google.com/'
  let provider

  beforeEach(async () => {
    provider = new ethers.providers.JsonRpcProvider()
    ;[accountA, accountB, accountC, accountD] = await ethers.getSigners()
    const NFT = await ethers.getContractFactory('RelipaNFT')
    nft = await NFT.deploy('9999', '2')
    await nft.deployed()

    const HdnToken = await ethers.getContractFactory('HdnToken')
    hdntoken = await HdnToken.deploy()
    await hdntoken.deployed()

    const Treasure = await ethers.getContractFactory('RelipaTreasure')
    treasure = await Treasure.deploy(uri, nft.address)
    await treasure.deployed()

    const setOperator = await nft.addOperator(treasure.address)
    await setOperator.wait()

    const MarketPlace = await ethers.getContractFactory('Marketplace')
    marketplace = await MarketPlace.deploy(nft.address, treasure.address, hdntoken.address, 2, 2, accountD.address)
    await marketplace.deployed()

    const MarketplaceAddress = await nft.setMarketPlaceAddress(marketplace.address)
    await MarketplaceAddress.wait()

    const AuctionContract = await ethers.getContractFactory('AuctionContract1')
    auctionContract1 = await AuctionContract.deploy(hdntoken.address, nft.address, accountD.address, 4)
    await auctionContract1.deployed()
  })
})
