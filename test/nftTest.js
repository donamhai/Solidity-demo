const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Relipa NFT', function () {
  let [accountA, accountB, accountC] = []
  let nft
  let address0 = '0x000000000000000000000000000000000000000'
  let uri = 'google.com'

  beforeEach(async () => {
    ;[accountA, accountB, accountC] = await ethers.getSigners()
    const NFT = await ethers.getContractFactory('RelipaNFT')
    nft = await NFT.deploy('9999', '2')
    await nft.deployed()
  })

  describe('common', function () {
    it("Name should be 'RLP_HDN'", async () => {
      const name = await nft.name()
      expect(name).to.be.a.string
      expect(name).to.equal('RLP_HDN')
    })
    it("Symbol should be 'RLP'", async () => {
      const name = await nft.symbol()
      expect(name).to.be.a.string
      expect(name).to.equal('RLP')
    })
    it('getTimeExpireDate should return right value', async () => {
      expect(await nft.getTimeExpireDate()).to.be.equal(9999)
    })
    it('getDiscount should return right value', async () => {
      expect(await nft.getDiscount()).to.be.equal(2)
    })
    it('Balance of account B and C should return right value', async function () {
      expect(await nft.balanceOf(accountB.address)).to.be.equal(0)
      expect(await nft.balanceOf(accountC.address)).to.be.equal(0)
    })
  })

  describe('setTimeExpireDate', function () {
    it('should revert if not admin role', async () => {
      await expect(nft.connect(accountB).setTimeExpireDate(8888)).to.be.reverted
    })
    it('should revert if new time = 0', async () => {
      await expect(nft.setTimeExpireDate(0)).to.be.revertedWith('Please input new time expire date time > 0')
    })
    it('should set time expire date correctly', async () => {
      await nft.setTimeExpireDate(8888)
      expect(await nft.getTimeExpireDate()).to.be.equal(8888)
    })
  })

  describe('setDiscount', function () {
    it('should revert if not admin role', async () => {
      await expect(nft.connect(accountB).setDiscount(3)).to.be.reverted
    })
    it('should revert if new time < 0 ', async () => {
      await expect(nft.setDiscount(-1)).to.be.revertedWith('Please input new discount among 0 and 100')
    })
    it('should revert if new time > 100 ', async () => {
      await expect(nft.setDiscount(101)).to.be.revertedWith('Please input new discount among 0 and 100')
    })
    it('should set discount correctly', async () => {
      await nft.setDiscount(50)
      expect(await nft.getDiscount()).to.be.equal(50)
    })

    describe('claimToken', function () {
      it('should revert if mint to zero address', async () => {
        await expect(nft.claim)
      })
      it('', async () => {})
      it('', async () => {})
      it('', async () => {})
      it('', async () => {})
    })
  })

  describe('setBaseTokenURI', function () {
    it('should revert if not admin role', async () => {
      await expect(nft.connect(accountB).setBaseTokenURI('google.com')).to.be.reverted
    })
    it('should set base token URI correctly', async () => {
      await nft.setBaseTokenURI('google.com')
    })
    it('', async () => {})
    it('', async () => {})
  })
})
