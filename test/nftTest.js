const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Relipa NFT', function () {
  let [accountA, accountB, accountC] = []
  let nft
  let address0 = '0x0000000000000000000000000000000000000000'
  let uri = 'google.com/'
  let provider

  beforeEach(async () => {
    provider = new ethers.providers.JsonRpcProvider()
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
      const tx1 = await nft.setTimeExpireDate(8888)
      await tx1.wait()
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
      const tx1 = await nft.setDiscount(50)
      await tx1.wait()
      expect(await nft.getDiscount()).to.be.equal(50)
    })
  })
  describe('claimToken', function () {
    it('should revert if mint to zero address', async () => {
      await expect(nft.claimToken(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should claim token correctly', async () => {
      const tx1 = await nft.claimToken(accountA.address)
      const txReceipt1 = await tx1.wait()
      const timestamp1 = (await ethers.provider.getBlock(txReceipt1.blockNumber)).timestamp
      expect(await nft.balanceOf(accountA.address)).to.be.equal(1)
      expect(await nft.ownerOf(1)).to.be.equal(accountA.address)
      expect(await nft.getMetadataInfo(1)).to.be.eql([accountA.address, 2, timestamp1 + 9999])
      expect(await nft.getTokensOfUser(accountA.address)).to.be.eql([[accountA.address, 2, timestamp1 + 9999]])

      const tx2 = await nft.claimToken(accountA.address)
      const txReceipt2 = await tx2.wait()
      const timestamp2 = (await ethers.provider.getBlock(txReceipt2.blockNumber)).timestamp
      expect(await nft.balanceOf(accountA.address)).to.be.equal(2)
      expect(await nft.ownerOf(2)).to.be.equal(accountA.address)
      expect(await nft.getMetadataInfo(2)).to.be.eql([accountA.address, 2, timestamp2 + 9999])
      expect(await nft.getTokensOfUser(accountA.address)).to.be.eql([
        [accountA.address, 2, timestamp1 + 9999],
        [accountA.address, 2, timestamp2 + 9999],
      ])

      const tx3 = await nft.claimToken(accountB.address)
      const txReceipt3 = await tx3.wait()
      const timestamp3 = (await ethers.provider.getBlock(txReceipt3.blockNumber)).timestamp
      expect(await nft.balanceOf(accountB.address)).to.be.equal(1)
      expect(await nft.ownerOf(3)).to.be.equal(accountB.address)
      expect(await nft.getMetadataInfo(3)).to.be.eql([accountB.address, 2, timestamp3 + 9999])
      expect(await nft.getTokensOfUser(accountB.address)).to.be.eql([[accountB.address, 2, timestamp3 + 9999]])
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
      const tx1 = await nft.claimBatchToken(accountA.address, 3)
      const txReceipt1 = await tx1.wait()
      const timestamp1 = (await ethers.provider.getBlock(txReceipt1.blockNumber)).timestamp
      expect(await nft.balanceOf(accountA.address)).to.be.equal(3)
      expect(await nft.ownerOf(3)).to.be.equal(accountA.address)
      expect(await nft.getMetadataInfo(3)).to.be.eql([accountA.address, 2, timestamp1 + 9999])
      expect(await nft.getTokensOfUser(accountA.address)).to.be.eql([
        [accountA.address, 2, timestamp1 + 9999],
        [accountA.address, 2, timestamp1 + 9999],
        [accountA.address, 2, timestamp1 + 9999],
      ])

      const tx2 = await nft.claimBatchToken(accountB.address, 3)
      const txReceipt2 = await tx2.wait()
      const timestamp2 = (await ethers.provider.getBlock(txReceipt2.blockNumber)).timestamp
      expect(await nft.balanceOf(accountB.address)).to.be.equal(3)
      expect(await nft.ownerOf(6)).to.be.equal(accountB.address)
      expect(await nft.getMetadataInfo(6)).to.be.eql([accountB.address, 2, timestamp2 + 9999])
      expect(await nft.getTokensOfUser(accountB.address)).to.be.eql([
        [accountB.address, 2, timestamp2 + 9999],
        [accountB.address, 2, timestamp2 + 9999],
        [accountB.address, 2, timestamp2 + 9999],
      ])
    })
  })

  describe('setBaseTokenURI', function () {
    it('should revert if empty string input', async () => {
      await expect(nft.connect(accountB).setBaseTokenURI('')).to.be.reverted
    })
    it('should revert if not admin role', async () => {
      await expect(nft.connect(accountB).setBaseTokenURI('google.com')).to.be.reverted
    })
    it('should revert if tokenId = 0', async () => {
      await expect(nft.tokenURI(0)).to.be.reverted
    })
    it('should revert if tokenId does not exist', async () => {
      await expect(nft.tokenURI(1)).to.be.reverted
    })
    it('should set base token URI correctly', async () => {
      const tx1 = await nft.setBaseTokenURI(uri)
      await tx1.wait()
      const tx2 = await nft.claimToken(accountA.address)
      await tx2.wait()
      expect(await nft.tokenURI(1)).to.be.equal(uri + '1')
      const tx3 = await nft.claimToken(accountB.address)
      await tx3.wait()
      expect(await nft.tokenURI(2)).to.be.equal(uri + '2')
    })
  })

  describe('transferNFT', function () {
    it('should revert if from address is zero address', async () => {
      await expect(nft.transferNFT(address0, accountB.address, 1)).to.be.reverted
    })
    it('should revert if to address is zero address', async () => {
      await expect(nft.transferNFT(accountA.address, address0, 1)).to.be.reverted
    })
    it('should revert if token Id = 0', async () => {
      await expect(nft.transferNFT(accountA.address, accountB.address, 0)).to.be.reverted
    })
    it('should revert if balance of from addess = 0', async () => {
      await expect(nft.transferNFT(accountA.address, accountB.address, 1)).to.be.reverted
    })
    it('should revert if is not owner of NFT', async () => {
      const tx1 = await nft.claimToken(accountA.address)
      await tx1.wait()
      await expect(nft.transferNFT(accountA.address, accountB.address, 2)).to.be.reverted
    })
    it('should transfer NFT correctly', async () => {
      const tx2 = await nft.claimBatchToken(accountA.address, 3)
      await tx2.wait()
      expect(await nft.balanceOf(accountA.address)).to.be.equal(3)
      expect(await nft.balanceOf(accountB.address)).to.be.equal(0)
      expect(await nft.ownerOf(3)).to.be.equal(accountA.address)

      const tx3 = await nft.transferNFT(accountA.address, accountB.address, 3)
      await tx3.wait()
      expect(await nft.balanceOf(accountA.address)).to.be.equal(2)
      expect(await nft.balanceOf(accountB.address)).to.be.equal(1)
      expect(await nft.ownerOf(3)).to.be.equal(accountB.address)
    })
  })
})
