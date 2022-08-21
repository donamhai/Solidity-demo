const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Relipa Treasure', async () => {
  let [accountA, accountB, accountC, accountD] = []
  let treasure
  let nft
  let hdntoken
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

    const HdnToken = await ethers.getContractFactory('HdnToken')
    hdntoken = await HdnToken.deploy()
    await hdntoken.deployed()

    const Treasure = await ethers.getContractFactory('RelipaTreasure')
    treasure = await Treasure.deploy(uri, nft.address)
    await treasure.deployed()

    const MarketPlace = await ethers.getContractFactory('Marketplace')
    marketplace = await MarketPlace.deploy(nft.address, treasure.address, hdntoken.address, 2, 2, accountD.address)
    await marketplace.deployed()

    const setOperator1 = await nft.addOperator1(treasure.address)
    await setOperator1.wait()
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
    it('should revert if empty string', async () => {
      await expect(treasure.setURI('')).to.be.revertedWith('Please input treasure URI')
    })
    it('should revert if not admin role', async () => {
      await expect(treasure.connect(accountB).setURI('dantri.com')).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should set URI correctly', async () => {
      const tx1 = await treasure.setURI('dantri.com')
      await tx1.wait()
      expect(await treasure.getURI()).to.be.equal('dantri.com')
    })
  })

  describe('setNftAddress', async () => {
    it('should revert if address 0', async () => {
      await expect(treasure.setNftAddress(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should revert if not admin role', async () => {
      await expect(treasure.connect(accountB).setNftAddress(nft.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should revert if not contract address', async () => {
      await expect(treasure.setNftAddress(accountB.address)).to.be.revertedWith('You must input token address')
    })
    it('should set market place address correctly', async () => {
      const tx1 = await treasure.setNftAddress(nft.address)
      await tx1.wait()
      expect(await treasure.getNftAddress()).to.be.equal(nft.address)
    })
  })
  describe('claimTreasure', async () => {
    it('should revert if not admin role', async () => {
      await expect(treasure.connect(accountB).claimTreasure(5, accountB.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should revert if amount = 0', async () => {
      await expect(treasure.claimTreasure(0, accountB.address)).to.be.revertedWith('Please input amount greater than 0')
    })
    it('should claim treasure correctly', async () => {
      const tx1 = await treasure.claimTreasure(5, accountB.address)
      await tx1.wait()
      const tx2 = await treasure.claimTreasure(8, accountC.address)
      await tx2.wait()
      expect(await treasure.getBalanceOf(accountB.address)).to.be.equal(5)
      expect(await treasure.getBalanceOf(accountC.address)).to.be.equal(8)
    })
  })
  describe('unbox', async () => {
    beforeEach(async () => {
      const claim = await treasure.claimTreasure(5, accountB.address)
      await claim.wait()
    })
    it('should revert if amount = 0', async () => {
      await expect(treasure.connect(accountB).unbox(0)).to.be.revertedWith('Please input amount greater than 0')
    })
    it('should revert if amount greater than sender amount', async () => {
      await expect(treasure.connect(accountB).unbox(6)).to.be.revertedWith(
        'Amount must be less or equal than sender treasure amount'
      )
    })
    it('should unbox correctly', async () => {
      const tx1 = await treasure.connect(accountB).unbox(1)
      await tx1.wait()
      expect(await treasure.getBalanceOf(accountB.address)).to.be.equal(4)
      expect(await nft.balanceOf(accountB.address)).to.be.equal(1)

      const tx2 = await treasure.connect(accountB).unbox(3)
      await tx2.wait()
      expect(await treasure.getBalanceOf(accountB.address)).to.be.equal(1)
      expect(await nft.balanceOf(accountB.address)).to.be.equal(4)

      await expect(treasure.connect(accountB).unbox(2)).to.be.revertedWith(
        'Amount must be less or equal than sender treasure amount'
      )
    })
  })
  describe('safeTransfer', async () => {
    beforeEach(async () => {
      const claim = await treasure.claimTreasure(5, accountB.address)
      await claim.wait()
    })
    it('should revert if from address is zero address', async () => {
      await expect(treasure.safeTransfer(address0, accountB.address, 1, 2)).to.be.revertedWith(
        'Address can not be zero address'
      )
    })
    it('should revert if to address is zero address', async () => {
      await expect(treasure.safeTransfer(accountB.address, address0, 1, 2)).to.be.revertedWith(
        'Address can not be zero address'
      )
    })
    it('should revert if amount = 0', async () => {
      await expect(treasure.safeTransfer(accountB.address, accountC.address, 1, 0)).to.be.revertedWith(
        'Please input amount greater than 0'
      )
    })
    it('should revert if amount > sender amount', async () => {
      await expect(treasure.safeTransfer(accountB.address, accountC.address, 1, 6)).to.be.revertedWith(
        'Amount must be less or equal than sender treasure amount'
      )
    })
    it('should revert if not the operator2', async () => {
      await expect(
        treasure.connect(accountB).safeTransfer(accountB.address, accountC.address, 1, 1)
      ).to.be.revertedWith('Caller is not the operator2')
      await expect(
        treasure
          .connect(accountB)
          .safeTransferFrom(accountB.address, accountC.address, 1, 1, ethers.utils.formatBytes32String(''))
      ).to.be.revertedWith('Caller is not the operator2')

      await expect(
        treasure
          .connect(accountB)
          .safeBatchTransferFrom(accountB.address, accountC.address, [1], [1], ethers.utils.formatBytes32String(''))
      ).to.be.revertedWith('Caller is not the operator2')
    })
    it('should revert if balance of from addess = 0', async () => {
      expect(await treasure.getBalanceOf(accountC.address)).to.be.equal(0)
      const tx1 = await treasure.connect(accountC).setApprovalForAll(marketplace.address, true)
      await tx1.wait()
      await expect(marketplace.connect(accountC).addOrderTreasure(1, hdntoken.address, 1000, 1)).to.be.revertedWith(
        'Amount must be less or equal than sender treasure amount'
      )
    })
    it('should transfer treasure correctly', async () => {
      expect(await treasure.getBalanceOf(accountC.address)).to.be.equal(0)
      expect(await treasure.getBalanceOf(accountB.address)).to.be.equal(5)
      const setOperator2 = await treasure.addOperator2(marketplace.address)
      await setOperator2.wait()

      const tx1 = await treasure.connect(accountB).setApprovalForAll(marketplace.address, true)
      await tx1.wait()
      const tx2 = await marketplace.connect(accountB).addOrderTreasure(1, hdntoken.address, 1000, 2)
      await tx2.wait()
      const tx3 = await hdntoken.claim(50000, accountC.address)
      await tx3.wait()
      const tx4 = await hdntoken.connect(accountC).approve(marketplace.address, 50000)
      await tx4.wait()
      const tx5 = await marketplace.connect(accountC).buyOrderTreasure(1)
      await tx5.wait()
      expect(await treasure.getBalanceOf(accountC.address)).to.be.equal(2)
      expect(await treasure.getBalanceOf(accountB.address)).to.be.equal(3)
    })
  })
})
