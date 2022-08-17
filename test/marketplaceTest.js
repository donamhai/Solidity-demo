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
    it('setNftAddress should return right value', async () => {
      expect(await marketplace.getNftAddress()).to.be.equal(nft.address)
    })
    it('setTreasureAddress should return right value', async () => {
      expect(await marketplace.getTreasureAddress()).to.be.equal(treasure.address)
    })
    it('getOrderOfNFT should return right value', async () => {
      expect(await marketplace.getOrderOfNFT(1)).to.be.eql([
        address0,
        ethers.BigNumber.from(0),
        address0,
        ethers.BigNumber.from(0),
      ])
    })
    it('getOrderOfTreasure should return right value', async () => {
      expect(await marketplace.getOrderOfTreasure(1)).to.be.eql([
        address0,
        ethers.BigNumber.from(0),
        address0,
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

  describe('setNftAddress', async () => {
    it('should return if address 0', async () => {
      await expect(marketplace.setNftAddress(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should revert if not admin', async () => {
      await expect(marketplace.connect(accountB).setNftAddress(accountC.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should revert if not contract', async () => {
      await expect(marketplace.setNftAddress(accountC.address)).to.be.revertedWith(
        'You must input nft contract address'
      )
    })
    it('should set nft address correctly', async () => {
      const NFT2 = await ethers.getContractFactory('RelipaNFT')
      const nft2 = await NFT2.deploy('9999', '2')
      await nft2.deployed()

      const tx1 = await marketplace.setNftAddress(nft2.address)
      await tx1.wait()

      expect(await marketplace.getNftAddress()).to.be.equal(nft2.address)
    })
  })

  describe('setTreasureAddress', async () => {
    it('should return if address 0', async () => {
      await expect(marketplace.setTreasureAddress(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should revert if not admin', async () => {
      await expect(marketplace.connect(accountB).setTreasureAddress(accountC.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should revert if not contract', async () => {
      await expect(marketplace.setTreasureAddress(accountC.address)).to.be.revertedWith(
        'You must input treasure contract address'
      )
    })
    it('should set treasure address correctly', async () => {
      const Treasure2 = await ethers.getContractFactory('RelipaTreasure')
      const treasure2 = await Treasure2.deploy('google.com', nft.address)
      await treasure2.deployed()

      const tx1 = await marketplace.setTreasureAddress(treasure2.address)
      await tx1.wait()

      expect(await marketplace.getTreasureAddress()).to.be.equal(treasure2.address)
    })
  })

  describe('setRecipientAddress', async () => {
    it('should return if address 0', async () => {
      await expect(marketplace.setRecipientAddress(address0)).to.be.revertedWith('Address can not be zero address')
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

      const MarketplaceAddress = await nft.setMarketPlaceAddress(marketplace.address)
      await MarketplaceAddress.wait()
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
      expect(await nft.ownerOf(1)).to.be.equal(marketplace.address)
    })
  })
  describe('addOrderTreasure', async () => {
    beforeEach(async () => {
      const claimTreasure = await treasure.claimTreasure(5, accountB.address)
      await claimTreasure.wait()
      expect(await treasure.getBalanceOf(accountB.address)).to.be.equal(5)

      const MarketplaceAddress = await treasure.setMarketPlaceAddress(marketplace.address)
      await MarketplaceAddress.wait()
    })
    it('should revert if unsupport token payment', async () => {
      await expect(marketplace.connect(accountB).addOrderTreasure(1, nft.address, 1000, 3)).to.be.revertedWith(
        'NFTMarketplace: unsupport payment token'
      )
    })
    it('should revert if Invalid treasureType', async () => {
      await expect(marketplace.connect(accountB).addOrderTreasure(2, hdntoken.address, 1000, 3)).to.be.revertedWith(
        'Invalid treasureType'
      )
    })
    it('should revert if amount = 0', async () => {
      await expect(marketplace.connect(accountB).addOrderTreasure(1, hdntoken.address, 1000, 0)).to.be.revertedWith(
        'Amount must be greater than 0'
      )
    })
    it('should revert if not approve treasure token', async () => {
      await expect(marketplace.connect(accountB).addOrderTreasure(1, hdntoken.address, 1000, 3)).to.be.revertedWith(
        'NFTMarketplace: The contract is unauthorized to manage this token'
      )
    })
    it('should revert if price = 0', async () => {
      const tx1 = await treasure.connect(accountB).setApprovalForAll(marketplace.address, true)
      await tx1.wait()
      await expect(marketplace.connect(accountB).addOrderTreasure(1, hdntoken.address, 0, 3)).to.be.revertedWith(
        'NFTMarketplace: price must be greater than 0'
      )
    })
    it('should add order treasure correctly', async () => {
      const tx1 = await treasure.connect(accountB).setApprovalForAll(marketplace.address, true)
      await tx1.wait()
      const tx2 = await marketplace.connect(accountB).addOrderTreasure(1, hdntoken.address, 1000, 3)
      await tx2.wait()
      expect(await marketplace.getOrderOfTreasure(1)).to.be.eql([
        accountB.address,
        ethers.BigNumber.from(1),
        hdntoken.address,
        ethers.BigNumber.from(1000),
        ethers.BigNumber.from(3),
        ethers.BigNumber.from(3000),
      ])
      expect(await treasure.getBalanceOf(accountB.address)).to.be.equal(2)
    })
  })
  describe('cancelOrderNFT', async () => {
    beforeEach(async () => {
      const claimTreasure = await treasure.claimTreasure(2, accountB.address)
      await claimTreasure.wait()
      const unbox = await treasure.connect(accountB).unbox(2)
      await unbox.wait()
      expect(await nft.balanceOf(accountB.address)).to.be.equal(2)

      const MarketplaceAddress = await nft.setMarketPlaceAddress(marketplace.address)
      await MarketplaceAddress.wait()

      const tx1 = await nft.connect(accountB).approve(marketplace.address, 1)
      await tx1.wait()
      const tx2 = await marketplace.connect(accountB).addOrderNFT(1, hdntoken.address, 1000)
      await tx2.wait()
    })
    it('should revert if orderId = 0', async () => {
      await expect(marketplace.connect(accountB).cancelOrderNFT(0)).to.be.revertedWith(
        'Order Id must be greater than 0'
      )
    })
    it('should revert if not owner of order', async () => {
      await expect(marketplace.connect(accountC).cancelOrderNFT(1)).to.be.revertedWith('NFTMarketplace: must be owner')
    })
    it('should cancel order NFT correctly', async () => {
      const tx1 = await marketplace.connect(accountB).cancelOrderNFT(1)
      await tx1.wait()
      expect(await marketplace.getOrderOfNFT(1)).to.be.eql([
        address0,
        ethers.BigNumber.from(0),
        address0,
        ethers.BigNumber.from(0),
      ])
      expect(await nft.balanceOf(accountB.address)).to.be.equal(2)
      expect(await nft.ownerOf(1)).to.be.equal(accountB.address)
    })
  })
  describe('cancelTreasureNFT', async () => {
    beforeEach(async () => {
      const claimTreasure = await treasure.claimTreasure(5, accountB.address)
      await claimTreasure.wait()

      expect(await treasure.getBalanceOf(accountB.address)).to.be.equal(5)

      const MarketplaceAddress = await treasure.setMarketPlaceAddress(marketplace.address)
      await MarketplaceAddress.wait()

      const tx1 = await treasure.connect(accountB).setApprovalForAll(marketplace.address, true)
      await tx1.wait()
      const tx2 = await marketplace.connect(accountB).addOrderTreasure(1, hdntoken.address, 1000, 3)
      await tx2.wait()
    })
    it('should revert if orderId = 0', async () => {
      await expect(marketplace.connect(accountB).cancelOrderTreasure(0)).to.be.revertedWith(
        'Order Id must be greater than 0'
      )
    })
    it('should revert if not owner of order', async () => {
      await expect(marketplace.connect(accountC).cancelOrderTreasure(1)).to.be.revertedWith(
        'NFTMarketplace: must be owner'
      )
    })
    it('should cancel order treasure correctly', async () => {
      const tx1 = await marketplace.connect(accountB).cancelOrderTreasure(1)
      await tx1.wait()
      expect(await marketplace.getOrderOfTreasure(1)).to.be.eql([
        address0,
        ethers.BigNumber.from(0),
        address0,
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(0),
      ])
      expect(await treasure.getBalanceOf(accountB.address)).to.be.equal(5)
    })
  })
  describe('buyOrderNFT', async () => {
    beforeEach(async () => {
      const claimTreasure = await treasure.claimTreasure(2, accountB.address)
      await claimTreasure.wait()
      const unbox = await treasure.connect(accountB).unbox(2)
      await unbox.wait()
      expect(await nft.balanceOf(accountB.address)).to.be.equal(2)

      const MarketplaceAddress = await nft.setMarketPlaceAddress(marketplace.address)
      await MarketplaceAddress.wait()

      const tx1 = await nft.connect(accountB).approve(marketplace.address, 1)
      await tx1.wait()
      const tx2 = await marketplace.connect(accountB).addOrderNFT(1, hdntoken.address, 1000)
      await tx2.wait()

      const tx3 = await hdntoken.claim(10000, accountC.address)
      await tx3.wait()

      const tx4 = await hdntoken.connect(accountC).approve(marketplace.address, 50000)
      await tx4.wait()
    })
    it('should revert if orderId = 0', async () => {
      await expect(marketplace.connect(accountC).buyOrderNFT(0)).to.be.revertedWith('Order Id must be greater than 0')
    })
    it('should revert if buyer is seller', async () => {
      await expect(marketplace.connect(accountB).buyOrderNFT(1)).to.be.revertedWith(
        'NFTMarketplace: buyer must be different from seller'
      )
    })
    it('should revert if buyer is not enough token to buy', async () => {
      const tx1 = await hdntoken.connect(accountC).transfer(accountD.address, 10000)
      await tx1.wait()

      await expect(marketplace.connect(accountC).buyOrderNFT(1)).to.be.revertedWith('You dont have enough token to buy')
    })
    it('should buy order NFT correctly', async () => {
      const tx1 = await marketplace.connect(accountC).buyOrderNFT(1)
      await tx1.wait()

      expect(await hdntoken.balanceOf(accountB.address)).to.be.equal(980)
      expect(await hdntoken.balanceOf(accountD.address)).to.be.equal(20)
      expect(await nft.balanceOf(accountC.address)).to.be.equal(1)
      expect(await marketplace.getOrderOfNFT(1)).to.be.eql([
        address0,
        ethers.BigNumber.from(0),
        address0,
        ethers.BigNumber.from(0),
      ])
    })
  })
  describe('buyOrderTreasure', async () => {
    beforeEach(async () => {
      const claimTreasure = await treasure.claimTreasure(5, accountB.address)
      await claimTreasure.wait()
      expect(await treasure.getBalanceOf(accountB.address)).to.be.equal(5)

      const MarketplaceAddress = await treasure.setMarketPlaceAddress(marketplace.address)
      await MarketplaceAddress.wait()

      const tx1 = await treasure.connect(accountB).setApprovalForAll(marketplace.address, true)
      await tx1.wait()
      const tx2 = await marketplace.connect(accountB).addOrderTreasure(1, hdntoken.address, 1000, 3)
      await tx2.wait()

      const tx3 = await hdntoken.claim(10000, accountC.address)
      await tx3.wait()

      const tx4 = await hdntoken.connect(accountC).approve(marketplace.address, 50000)
      await tx4.wait()
    })
    it('should revert if orderId = 0', async () => {
      await expect(marketplace.connect(accountC).buyOrderTreasure(0)).to.be.revertedWith(
        'Order Id must be greater than 0'
      )
    })
    it('should revert if buyer is seller', async () => {
      await expect(marketplace.connect(accountB).buyOrderTreasure(1)).to.be.revertedWith(
        'NFTMarketplace: buyer must be different from seller'
      )
    })
    it('should revert if buyer is not enough token to buy', async () => {
      const tx1 = await hdntoken.connect(accountC).transfer(accountD.address, 10000)
      await tx1.wait()

      await expect(marketplace.connect(accountC).buyOrderTreasure(1)).to.be.revertedWith(
        'You dont have enough token to buy'
      )
    })
    it('should buy order NFT correctly', async () => {
      const tx1 = await marketplace.connect(accountC).buyOrderTreasure(1)
      await tx1.wait()

      expect(await hdntoken.balanceOf(accountB.address)).to.be.equal(2940)
      expect(await hdntoken.balanceOf(accountD.address)).to.be.equal(60)
      expect(await treasure.getBalanceOf(accountC.address)).to.be.equal(3)
      expect(await marketplace.getOrderOfTreasure(1)).to.be.eql([
        address0,
        ethers.BigNumber.from(0),
        address0,
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(0),
      ])
    })
  })
})
