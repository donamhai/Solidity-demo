const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Relipa NFT', function () {
  let [accountA, accountB, accountC] = []
  let nft
  let address0 = '0x0000000000000000000000000000000000000000'
  let uri = 'google.com/'

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
      await expect(nft.setDiscount(0)).to.be.revertedWith('Please input new discount among 0 and 100')
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
        await expect(nft.claimToken(address0)).to.be.revertedWith('Address can not be zero address')
      })
      it('should claim token correctly', async () => {
        await nft.claimToken(accountA.address)
        expect(await nft.balanceOf(accountA.address)).to.be.equal(1)
        expect(await nft.ownerOf(1)).to.be.equal(accountA.address)
        expect(await nft.getMetadataInfo(1)).to.be.equal({
          ownerToken: accountA.address,
          discount: 2,
          expireDate: 9999,
        })
        await nft.claimToken(accountA.address)
        expect(await nft.balanceOf(accountA.address)).to.be.equal(2)
        expect(await nft.ownerOf(2)).to.be.equal(accountA.address)
        expect(await nft.getMetadataInfo(2)).to.be.equal({
          ownerToken: accountA.address,
          discount: 2,
          expireDate: 9999,
        })
        expect(await nft.getTokensOfUser(accountA.address)).to.be.equal([
          {
            ownerToken: accountA.address,
            discount: 2,
            expireDate: 9999,
          },
          {
            ownerToken: accountA.address,
            discount: 2,
            expireDate: 9999,
          },
        ])
        await nft.claimToken(accountB.address)
        expect(await nft.balanceOf(accountB.address)).to.be.equal(1)
        expect(await nft.ownerOf(3)).to.be.equal(accountB.address)
        expect(await nft.getMetadataInfo(3)).to.be.equal({
          ownerToken: accountB.address,
          discount: 2,
          expireDate: 9999,
        })
        expect(await nft.getTokensOfUser(accountB.address)).to.be.equal([
          {
            ownerToken: accountB.address,
            discount: 2,
            expireDate: 9999,
          },
        ])
      })
    })

    describe('claimBatchToken', function () {
      it('should revert if mint to zero address', async () => {
        await expect(nft.claimBatchToken(address0, 5)).to.be.revertedWith('Address can not be zero address')
      })
      it('should revert if amount = 0', async () => {
        await expect(nft.claimBatchToken(accountA.address, 0)).to.be.reverted
      })
      it('should claim batch token correctly', async () => {
        await nft.claimBatchToken(accountA.address, 2)
        expect(await nft.balanceOf(accountA.address)).to.be.equal(2)
        expect(await nft.ownerOf(2)).to.be.equal(accountA.address)
        expect(await nft.getTokensOfUser(accountA.address)).to.be.equal([
          {
            ownerToken: accountA.address,
            discount: 2,
            expireDate: 9999,
          },
          {
            ownerToken: accountA.address,
            discount: 2,
            expireDate: 9999,
          },
        ])
        await nft.claim(accountB.address, 2)
        expect(await nft.balanceOf(accountB.address)).to.be.equal(2)
        expect(await nft.ownerOf(4)).to.be.equal(accountB.address)
        expect(await nft.getTokensOfUser(accountB.address)).to.be.equal([
          {
            ownerToken: accountB.address,
            discount: 2,
            expireDate: 9999,
          },
          {
            ownerToken: accountB.address,
            discount: 2,
            expireDate: 9999,
          },
        ])
      })
    })
  })

  describe('setBaseTokenURI', function () {
    it('should revert if not admin role', async () => {
      await expect(nft.connect(accountB).setBaseTokenURI('google.com')).to.be.reverted
    })
    it('should revert if tokenId = 0', async () => {
      expect(await nft.tokenURI(0)).to.be.revertedWith('Token id must be greater than 0')
    })
    it('should revert if tokenId does not exist', async () => {
      expect(await nft.tokenURI(1)).to.be.reverted
    })
    it('should set base token URI correctly', async () => {
      await nft.setBaseTokenURI(uri)
      await nft.claimToken(accountA.address)
      expect(await nft.tokenURI(1)).to.be.equal(uri + '1')
      await nft.claimToken(accountB.address)
      expect(await nft.tokenURI(2)).to.be.equal(uri + '2')
    })
  })
})
