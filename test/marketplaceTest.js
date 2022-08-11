const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Market Place', async () => {
  let [accountA, accountB, accountC, accountD] = []
  let treasure
  let nft
  let hdntoken
  let marketplace
  let address0 = '0x0000000000000000000000000000000000000000'
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
    treasure = await Treasure.deploy('google.com', nft.address)
    await treasure.deployed()

    const setOperator = await nft.addOperator(treasure.address)
    await setOperator.wait()

    const MarketPlace = await ethers.getContractFactory('Marketplace')
    marketplace = await MarketPlace.deploy(nft.address, treasure.address, hdntoken.address, 2, 2, accountD.address)
    await marketplace.deployed()
  })

  describe('common', async () => {
    it('getRecipientAddress should return right value', async () => {
      expect(await marketplace.getRecipientAddress()).to.be.equal(accountD.address)
    })
    it('getFeeDecimal should return right value', async () => {
      expect(await marketplace.getFeeDecimal()).to.be.equal(2)
    })
    it('getFeeRate should return right value', async () => {
      expect(await marketplace.getFeeRate()).to.be.equal(2)
    })
    it('getOrderOfNFT should return right value', async () => {
      expect(await marketplace.getOrderOfNFT(1)).to.be.eql([
        '0x0000000000000000000000000000000000000000',
        ethers.BigNumber.from(0),
        '0x0000000000000000000000000000000000000000',
        ethers.BigNumber.from(0),
      ])
    })
    it('getOrderOfTreasure should return right value', async () => {
      expect(await marketplace.getOrderOfTreasure(1)).to.be.eql([
        '0x0000000000000000000000000000000000000000',
        ethers.BigNumber.from(0),
        '0x0000000000000000000000000000000000000000',
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(0),
      ])
    })
  })
  describe('addPaymentToken', async () => {
    it('should return if address 0', async () => {
      await expect(marketplace.addPaymentToken(address0)).to.be.revertedWith(
        'NFTMarketplace: paymentToken_ is zero address'
      )
    })
    it('should return if added', async () => {
      await expect(marketplace.addPaymentToken(hdntoken.address)).to.be.revertedWith(
        'NFTMarketplace: already supported'
      )
    })
    it('should return if not admin', async () => {
      await expect(marketplace.connect(accountB).addPaymentToken(hdntoken.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should add payment token correctly', async () => {
      const TX1 = await ethers.getContractFactory('HdnToken')
      const tx1 = await TX1.deploy()
      await tx1.deployed()

      const tx2 = await marketplace.addPaymentToken(tx1.address)
      await tx2.wait()

      await expect(marketplace.addPaymentToken(tx1.address)).to.be.revertedWith('NFTMarketplace: already supported')
    })
  })
  describe('setRecipientAddress', async () => {
    it('should return if address 0', async () => {
      await expect(marketplace.setRecipientAddress(address0)).to.be.revertedWith(
        'NFTMarketplace: feeRecipient_ is zero address'
      )
    })
    it('should revert if not admin', async () => {
      await expect(marketplace.connect(accountB).setRecipientAddress(accountC.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should set recieve address correctly', async () => {
      const tx1 = await marketplace.setRecipientAddress(accountC.address)
      await tx1.wait()

      expect(await marketplace.getRecipientAddress()).to.be.equal(accountC.address)
    })
  })
  describe('setFeeRate', async () => {
    it('should revert if not admin', async () => {
      await expect(marketplace.connect(accountB).setFeeRate(2, 2)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should revert if feeDecimal =0', async () => {
      await expect(marketplace.setFeeRate(0, 2)).to.be.revertedWith('Fee decimal or Fee rate must be greater than 0')
    })
    it('should revert if feeRate =0', async () => {
      await expect(marketplace.setFeeRate(2, 0)).to.be.revertedWith('Fee decimal or Fee rate must be greater than 0')
    })
    it('should revert if feeRate >= 10**(feeDecimal_ + 2)', async () => {
      await expect(marketplace.setFeeRate(1, 11)).to.be.revertedWith('NFTMarketplace: bad fee rate')
    })
    it('should set feerate correctly', async () => {
      const tx1 = await marketplace.setFeeRate(2, 3)
      await tx1.wait()
      expect(await marketplace.getFeeDecimal()).to.be.equal(2)
      expect(await marketplace.getFeeRate()).to.be.equal(3)
    })
  })
  describe('addOrderNFT', async () => {
    beforeEach(async () => {
      const claimTreasure = await treasure.claimTreasure(2, accountB.address)
      await claimTreasure.wait()
      const unbox = await treasure.connect(accountB).unbox(2)
      await unbox.wait()
      expect(await nft.balanceOf(accountB.address)).to.be.equal(2)
    })
    it('should revert if unsupport token payment', async () => {
      await expect(marketplace.connect(accountB).addOrderNFT(1, nft.address, 1000)).to.be.revertedWith(
        'NFTMarketplace: unsupport payment token'
      )
    })
    it('should revert if invalid token', async () => {
      await expect(marketplace.connect(accountB).addOrderNFT(3, hdntoken.address, 1000)).to.be.revertedWith(
        'ERC721: invalid token ID'
      )
    })
    it('should revert if not owner token', async () => {
      const tx1 = await treasure.claimTreasure(1, accountC.address)
      await tx1.wait()
      const tx2 = await treasure.connect(accountC).unbox(1)
      await tx2.wait()
      await expect(marketplace.connect(accountB).addOrderNFT(3, hdntoken.address, 1000)).to.be.revertedWith(
        'NFTMarketplace: sender is not owner of token'
      )
    })
    it('should revert if not approve nft token', async () => {
      await expect(marketplace.connect(accountB).addOrderNFT(1, hdntoken.address, 1000)).to.be.revertedWith(
        'NFTMarketplace: The contract is unauthorized to manage this token'
      )
    })
    it('should revert if price = 0', async () => {
      const tx1 = await nft.connect(accountB).approve(marketplace.address, 1)
      await tx1.wait()
      await expect(marketplace.connect(accountB).addOrderNFT(1, hdntoken.address, 0)).to.be.revertedWith(
        'NFTMarketplace: price must be greater than 0'
      )
    })
    it('should add order nft correctly', async () => {
      const tx1 = await nft.connect(accountB).approve(marketplace.address, 1)
      await tx1.wait()
      const tx2 = await marketplace.connect(accountB).addOrderNFT(1, hdntoken.address, 1000)
      await tx2.wait()
      expect(await marketplace.getOrderOfNFT(1)).to.be.eql([
        accountB.address,
        ethers.BigNumber.from(1),
        hdntoken.address,
        ethers.BigNumber.from(1000),
      ])
      expect(await nft.balanceOf(accountB.address)).to.be.equal(1)
    })
  })
  describe('', async () => {})
  describe('', async () => {})
  describe('', async () => {})
  describe('', async () => {})
  describe('', async () => {})
  describe('', async () => {})
})
