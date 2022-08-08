const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Relipa NFT', async () => {
  let [accountA, accountB, accountC, accountD] = []
  let nft
  let treasure
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
    treasure = await Treasure.deploy('dantri.com', nft.address)
    await treasure.deployed()
    const setOperator = await nft.addOperator(treasure.address)
    await setOperator.wait()

    const MarketPlace = await ethers.getContractFactory('Marketplace')
    marketplace = await MarketPlace.deploy(nft.address, treasure.address, 2, 2, accountD.address)
    await marketplace.deployed()
  })

  describe('common', async () => {
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
    it('Balance of account B and C should return right value', async () => {
      expect(await nft.balanceOf(accountB.address)).to.be.equal(0)
      expect(await nft.balanceOf(accountC.address)).to.be.equal(0)
    })
  })

  describe('setMarketPlaceAddress', async () => {
    it('should revert if zero address', async () => {
      await expect(nft.setMarketPlaceAddress(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should revert if is not contract address', async () => {
      await expect(nft.setMarketPlaceAddress(accountB.address)).to.be.revertedWith('You must input marketplace address')
    })
    it('should set marketplace address correctly', async () => {
      const tx1 = await nft.setMarketPlaceAddress(marketplace.address)
      await tx1.wait()
      expect(await nft.getMarketPlaceAddress()).to.be.equal(marketplace.address)
    })
  })

  describe('setTimeExpireDate', async () => {
    it('should revert if not admin role', async () => {
      await expect(nft.connect(accountB).setTimeExpireDate(8888)).to.be.revertedWith('Ownable: caller is not the owner')
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

  describe('setDiscount', async () => {
    it('should revert if not admin role', async () => {
      await expect(nft.connect(accountB).setDiscount(3)).to.be.revertedWith('Ownable: caller is not the owner')
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

  describe('claimToken', async () => {
    it('should revert if mint to zero address', async () => {
      await expect(nft.claimToken(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should revert if not operator', async () => {
      await expect(nft.claimToken(accountB.address)).to.be.revertedWith('Caller is not the operator1')
    })
    it('should claim token correctly', async () => {
      const tx1 = await treasure.claimTreasure(2, accountA.address)
      await tx1.wait()
      const tx2 = await treasure.unbox(1)
      const txReceipt2 = await tx2.wait()
      const timestamp2 = (await ethers.provider.getBlock(txReceipt2.blockNumber)).timestamp
      expect(await nft.balanceOf(accountA.address)).to.be.equal(1)
      expect(await nft.ownerOf(1)).to.be.equal(accountA.address)
      expect(await nft.getMetadataInfo(1)).to.be.eql([accountA.address, 2, timestamp2 + 9999])
      expect(await nft.getTokensOfUser(accountA.address)).to.be.eql([[accountA.address, 2, timestamp2 + 9999]])

      const tx3 = await treasure.unbox(1)
      const txReceipt3 = await tx3.wait()
      const timestamp3 = (await ethers.provider.getBlock(txReceipt3.blockNumber)).timestamp
      expect(await nft.balanceOf(accountA.address)).to.be.equal(2)
      expect(await nft.ownerOf(2)).to.be.equal(accountA.address)
      expect(await nft.getMetadataInfo(2)).to.be.eql([accountA.address, 2, timestamp3 + 9999])
      expect(await nft.getTokensOfUser(accountA.address)).to.be.eql([
        [accountA.address, 2, timestamp2 + 9999],
        [accountA.address, 2, timestamp3 + 9999],
      ])

      const tx4 = await treasure.claimTreasure(1, accountB.address)
      await tx4.wait()
      const tx5 = await treasure.connect(accountB).unbox(1)
      const txReceipt5 = await tx5.wait()
      const timestamp5 = (await ethers.provider.getBlock(txReceipt5.blockNumber)).timestamp
      expect(await nft.balanceOf(accountB.address)).to.be.equal(1)
      expect(await nft.ownerOf(3)).to.be.equal(accountB.address)
      expect(await nft.getMetadataInfo(3)).to.be.eql([accountB.address, 2, timestamp5 + 9999])
      expect(await nft.getTokensOfUser(accountB.address)).to.be.eql([[accountB.address, 2, timestamp5 + 9999]])
    })
  })

  describe('claimBatchToken', async () => {
    it('should revert if mint to zero address', async () => {
      await expect(nft.claimBatchToken(address0, 5)).to.be.revertedWith('Address can not be zero address')
    })
    it('should revert if not operator', async () => {
      await expect(nft.claimBatchToken(accountA.address, 5)).to.be.revertedWith('Caller is not the operator1')
    })
    it('should revert if amount = 0', async () => {
      await expect(treasure.unbox(0)).to.be.revertedWith('Please input amount greater than 0')
    })
    it('should claim batch token correctly', async () => {
      const tx1 = await treasure.claimTreasure(3, accountA.address)
      await tx1.wait()
      const tx2 = await treasure.unbox(3)
      const txReceipt2 = await tx2.wait()

      const timestamp2 = (await ethers.provider.getBlock(txReceipt2.blockNumber)).timestamp
      expect(await nft.balanceOf(accountA.address)).to.be.equal(3)
      expect(await nft.ownerOf(3)).to.be.equal(accountA.address)
      expect(await nft.getMetadataInfo(3)).to.be.eql([accountA.address, 2, timestamp2 + 9999])
      expect(await nft.getTokensOfUser(accountA.address)).to.be.eql([
        [accountA.address, 2, timestamp2 + 9999],
        [accountA.address, 2, timestamp2 + 9999],
        [accountA.address, 2, timestamp2 + 9999],
      ])

      const tx3 = await treasure.claimTreasure(3, accountB.address)
      await tx3.wait()
      const tx4 = await treasure.connect(accountB).unbox(3)
      const txReceipt4 = await tx4.wait()

      const timestamp4 = (await ethers.provider.getBlock(txReceipt4.blockNumber)).timestamp
      expect(await nft.balanceOf(accountB.address)).to.be.equal(3)
      expect(await nft.ownerOf(6)).to.be.equal(accountB.address)
      expect(await nft.getMetadataInfo(6)).to.be.eql([accountB.address, 2, timestamp4 + 9999])
      expect(await nft.getTokensOfUser(accountB.address)).to.be.eql([
        [accountB.address, 2, timestamp4 + 9999],
        [accountB.address, 2, timestamp4 + 9999],
        [accountB.address, 2, timestamp4 + 9999],
      ])
    })
  })

  describe('setBaseTokenURI', async () => {
    it('should revert if empty string input', async () => {
      await expect(nft.setBaseTokenURI('')).to.be.revertedWith('Please input base token URI')
    })
    it('should revert if not admin role', async () => {
      await expect(nft.connect(accountB).setBaseTokenURI('google.com')).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should revert if tokenId = 0', async () => {
      await expect(nft.tokenURI(0)).to.be.revertedWith('Token id must be greater than 0')
    })
    it('should revert if tokenId does not exist', async () => {
      await expect(nft.tokenURI(1)).to.be.revertedWith('Token id is not available')
    })
    it('should set base token URI correctly', async () => {
      const tx1 = await nft.setBaseTokenURI(uri)
      await tx1.wait()
      const tx2 = await treasure.claimTreasure(2, accountA.address)
      await tx2.wait()
      const tx3 = await treasure.unbox(2)
      await tx3.wait()
      expect(await nft.tokenURI(1)).to.be.equal(uri + '1')
      expect(await nft.tokenURI(2)).to.be.equal(uri + '2')
    })
  })

  describe('transferNFT', async () => {
    let hdntoken
    beforeEach(async () => {
      const HdnToken = await ethers.getContractFactory('HdnToken')
      hdntoken = await HdnToken.deploy()
      await hdntoken.deployed()

      const MarketplaceAddress = await nft.setMarketPlaceAddress(marketplace.address)
      await MarketplaceAddress.wait()
      const addPaymentToken = await marketplace.addPaymentToken(hdntoken.address)
      await addPaymentToken.wait()
    })
    it('should revert if from address is zero address', async () => {
      await expect(nft.transferNFT(address0, accountB.address, 1)).to.be.revertedWith('Address can not be zero address')
    })
    it('should revert if to address is zero address', async () => {
      await expect(nft.transferNFT(accountA.address, address0, 1)).to.be.revertedWith('Address can not be zero address')
    })
    it('should revert if token Id = 0', async () => {
      await expect(nft.transferNFT(accountA.address, accountB.address, 0)).to.be.revertedWith(
        'Token id must be greater than 0'
      )
    })
    it('should revert if not transfer to market place', async () => {
      const tx1 = await treasure.claimTreasure(1, accountA.address)
      await tx1.wait()
      const tx2 = await treasure.unbox(1)
      await tx2.wait()
      await expect(nft.transferNFT(accountA.address, accountB.address, 1)).to.be.revertedWith(
        'Cannot transfer to another address, exclude marketplace!'
      )
      await expect(nft.transferFrom(accountA.address, accountB.address, 1)).to.be.revertedWith(
        'Cannot transfer to another address, exclude marketplace!'
      )
    })
    it('should revert if balance of from addess = 0', async () => {
      expect(await nft.balanceOf(accountA.address)).to.be.equal(0)
      await expect(marketplace.connect(accountB).addOrderNFT(1, hdntoken.address, 1000)).to.be.revertedWith(
        'ERC721: invalid token ID'
      )
    })
    it('should revert if is not owner of NFT', async () => {
      const tx1 = await treasure.claimTreasure(1, accountA.address)
      await tx1.wait()
      const tx2 = await treasure.unbox(1)
      await tx2.wait()
      await expect(marketplace.connect(accountB).addOrderNFT(1, hdntoken.address, 1000)).to.be.revertedWith(
        'NFTMarketplace: sender is not owner of token'
      )
    })
    it('should transfer NFT correctly', async () => {
      const tx1 = await treasure.claimTreasure(3, accountC.address)
      await tx1.wait()
      const tx2 = await treasure.connect(accountC).unbox(3)
      await tx2.wait()
      expect(await nft.balanceOf(accountC.address)).to.be.equal(3)
      expect(await nft.balanceOf(accountB.address)).to.be.equal(0)
      expect(await nft.ownerOf(3)).to.be.equal(accountC.address)

      const tx3 = await nft.connect(accountC).approve(marketplace.address, 1)
      await tx3.wait()
      const tx4 = await marketplace.connect(accountC).addOrderNFT(1, hdntoken.address, 1000)
      await tx4.wait()
      const tx5 = await hdntoken.claim(50000, accountB.address)
      await tx5.wait()
      const tx6 = await hdntoken.connect(accountB).approve(marketplace.address, 50000)
      await tx6.wait()
      const tx7 = await marketplace.connect(accountB).buyOrderNFT(1)
      await tx7.wait()
      expect(await nft.balanceOf(accountC.address)).to.be.equal(2)
      expect(await nft.balanceOf(accountB.address)).to.be.equal(1)
      expect(await nft.ownerOf(1)).to.be.equal(accountB.address)
    })
  })
})
