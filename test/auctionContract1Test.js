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

    const MarketPlace = await ethers.getContractFactory('Marketplace')
    marketplace = await MarketPlace.deploy(nft.address, treasure.address, hdntoken.address, 2, 2, accountD.address)
    await marketplace.deployed()

    const AuctionContract = await ethers.getContractFactory('AuctionContract1')
    auctionContract1 = await AuctionContract.deploy(hdntoken.address, nft.address, accountD.address, 4)
    await auctionContract1.deployed()

    const setOperator1 = await nft.addOperator1(treasure.address)
    await setOperator1.wait()

    const setOperator2 = await nft.addOperator2(marketplace.address)
    await setOperator2.wait()
  })
  describe('common', async () => {
    it('getRecipientAddress should return right value', async () => {
      expect(await auctionContract1.getRecipientAddress()).to.be.equal(accountD.address)
    })
    it('getTokenAddress should return right value', async () => {
      expect(await auctionContract1.getTokenAddress()).to.be.equal(hdntoken.address)
    })
    it('getNftAddress should return right value', async () => {
      expect(await auctionContract1.getNftAddress()).to.be.equal(nft.address)
    })
    it('getFeeRate should return right value', async () => {
      expect(await auctionContract1.getFeeRate()).to.be.equal(4)
    })
    it('getAuctionOfOwner should return right value', async () => {
      expect(await auctionContract1.connect(accountB).getAuctionOfOwner()).to.be.eql([])
    })
    it('getBalanceOfRecipient should return right value', async () => {
      expect(await auctionContract1.getBalanceOfRecipient()).to.be.equal(0)
    })
    it('getTotalAuctionsOfOwner should return right value ', async () => {
      expect(await auctionContract1.getTotalAuctionsOfOwner(accountB.address)).to.be.equal(0)
    })
    it('getAutionOfOrderId should return right value', async () => {
      expect(await auctionContract1.getAutionOfOrderId(1)).to.be.eql([
        address0,
        address0,
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(0),
        0,
        0,
        0,
      ])
    })
  })
  describe('setRecipientAddress', async () => {
    it('should return if address 0', async () => {
      await expect(auctionContract1.setRecipientAddress(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should return if not admin', async () => {
      await expect(auctionContract1.connect(accountB).setRecipientAddress(accountB.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should set recipient address correctly', async () => {
      const tx1 = await auctionContract1.setRecipientAddress(accountC.address)
      await tx1.wait()

      expect(await auctionContract1.getRecipientAddress()).to.be.equal(accountC.address)
    })
  })
  describe('setNftAddress', async () => {
    it('should return if address 0', async () => {
      await expect(auctionContract1.setNftAddress(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should revert if not admin', async () => {
      await expect(auctionContract1.connect(accountB).setNftAddress(accountC.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should revert if not contract', async () => {
      await expect(auctionContract1.setNftAddress(accountC.address)).to.be.revertedWith(
        'You must input nft contract address'
      )
    })
    it('should set nft address correctly', async () => {
      const NFT2 = await ethers.getContractFactory('RelipaNFT')
      const nft2 = await NFT2.deploy('9999', '2')
      await nft2.deployed()

      const tx1 = await auctionContract1.setNftAddress(nft2.address)
      await tx1.wait()

      expect(await auctionContract1.getNftAddress()).to.be.equal(nft2.address)
    })
  })
  describe('setTokenAddress', async () => {
    it('should return if address 0', async () => {
      await expect(auctionContract1.setTokenAddress(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should return if not admin', async () => {
      await expect(auctionContract1.connect(accountB).setTokenAddress(accountC.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should return if not contract', async () => {
      await expect(auctionContract1.setTokenAddress(accountC.address)).to.be.revertedWith(
        'You must input token address'
      )
    })
    it('should set token address correctly', async () => {
      const Token2 = await ethers.getContractFactory('HdnToken')
      const token2 = await Token2.deploy()
      await token2.deployed()

      const tx1 = await auctionContract1.setTokenAddress(token2.address)
      await tx1.wait()

      expect(await auctionContract1.getTokenAddress()).to.be.equal(token2.address)
    })
  })
  describe('setFeeRate', async () => {
    it('should return if not admin', async () => {
      await expect(auctionContract1.connect(accountB).setFeeRate(8)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should return if feerate = 0', async () => {
      await expect(auctionContract1.setFeeRate(0)).to.be.revertedWith('Fee Rate must among 0 to 100')
    })
    it('should return if feerate > 100', async () => {
      await expect(auctionContract1.setFeeRate(101)).to.be.revertedWith('Fee Rate must among 0 to 100')
    })
    it('should set feerate correctly', async () => {
      const tx1 = await auctionContract1.setFeeRate(8)
      await tx1.wait()

      expect(await auctionContract1.getFeeRate()).to.be.equal(8)
    })
  })
  describe('createAuction', async () => {
    beforeEach(async () => {
      const tx1 = await treasure.claimTreasure(2, accountB.address)
      await tx1.wait()
      const tx2 = await treasure.connect(accountB).unbox(2)
      await tx2.wait()
    })
    it('should return if nft token id  = 0', async () => {
      await expect(auctionContract1.connect(accountB).createAuction(0, 0, 10)).to.be.revertedWith('Invalid tokenId')
    })
    it('should return if not owner of token', async () => {
      await expect(auctionContract1.connect(accountC).createAuction(1, 0, 10)).to.be.revertedWith(
        'Sender is not owner of token'
      )
    })
    it('should return if The contract is unauthorized to manage this token', async () => {
      await expect(auctionContract1.connect(accountB).createAuction(1, 0, 10)).to.be.revertedWith(
        'The contract is unauthorized to manage this token'
      )
    })
    it('should return if start price < 1000', async () => {
      const tx1 = await nft.connect(accountB).approve(auctionContract1.address, 1)
      await tx1.wait()
      await expect(auctionContract1.connect(accountB).createAuction(1, 999, 10)).to.be.revertedWith(
        'Price must be greater than 1000'
      )
    })
    it('should return if duration  = 0', async () => {
      const tx1 = await nft.connect(accountB).approve(auctionContract1.address, 1)
      await tx1.wait()
      await expect(auctionContract1.connect(accountB).createAuction(1, 1000, 0)).to.be.revertedWith(
        'Duration auction must be greater than 0'
      )
    })
    it('should return if not operator2', async () => {
      const tx1 = await nft.connect(accountB).approve(auctionContract1.address, 1)
      await tx1.wait()
      await expect(auctionContract1.connect(accountB).createAuction(1, 1000, 10)).to.be.revertedWith(
        'Caller is not the operator2'
      )
    })
    it('should create aution correctly', async () => {
      const setOperator3 = await nft.addOperator2(auctionContract1.address)
      await setOperator3.wait()
      const tx1 = await nft.connect(accountB).approve(auctionContract1.address, 1)
      await tx1.wait()
      const tx2 = await auctionContract1.connect(accountB).createAuction(1, 1000, 20)
      const txReceipt2 = await tx2.wait()
      const timestamp2 = (await ethers.provider.getBlock(txReceipt2.blockNumber)).timestamp
      expect(await auctionContract1.connect(accountB).getAuctionOfOwner()).to.be.eql([ethers.BigNumber.from(1)])
      expect(await auctionContract1.getTotalAuctionsOfOwner(accountB.address)).to.be.equal(1)
      expect(await auctionContract1.getAutionOfOrderId(1)).to.be.eql([
        accountB.address,
        address0,
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(1),
        ethers.BigNumber.from(1000),
        timestamp2,
        20,
        timestamp2 + 20,
      ])

      const tx3 = await nft.connect(accountB).approve(auctionContract1.address, 2)
      await tx3.wait()
      const tx4 = await auctionContract1.connect(accountB).createAuction(2, 2000, 30)
      const txReceipt4 = await tx4.wait()
      const timestamp4 = (await ethers.provider.getBlock(txReceipt4.blockNumber)).timestamp
      expect(await auctionContract1.connect(accountB).getAuctionOfOwner()).to.be.eql([
        ethers.BigNumber.from(1),
        ethers.BigNumber.from(2),
      ])
      expect(await auctionContract1.getTotalAuctionsOfOwner(accountB.address)).to.be.equal(2)
      expect(await auctionContract1.getAutionOfOrderId(2)).to.be.eql([
        accountB.address,
        address0,
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(2),
        ethers.BigNumber.from(2000),
        timestamp4,
        30,
        timestamp4 + 30,
      ])
    })
  })
  describe('bidAuction', async () => {
    let timestamp
    beforeEach(async () => {
      const tx1 = await treasure.claimTreasure(2, accountB.address)
      await tx1.wait()
      const tx2 = await treasure.connect(accountB).unbox(2)
      await tx2.wait()
      const setOperator3 = await nft.addOperator2(auctionContract1.address)
      await setOperator3.wait()
      const tx3 = await nft.connect(accountB).approve(auctionContract1.address, 1)
      const tx4 = await auctionContract1.connect(accountB).createAuction(1, 1000, 20)
      const txReceipt4 = await tx4.wait()
      timestamp = (await ethers.provider.getBlock(txReceipt4.blockNumber)).timestamp
    })
    it('should return if auction order id = 0', async () => {
      await expect(auctionContract1.connect(accountC).bidAuction(0, 1001)).to.be.revertedWith(
        'Invalid auction order id'
      )
    })
    it('should return if bid time > = end time', async () => {
      await network.provider.send('evm_increaseTime', [30])
      await expect(auctionContract1.connect(accountC).bidAuction(1, 1001)).to.be.revertedWith(
        'The auction has already ended'
      )
    })
    it('should revert if bidder is the owner of auction', async () => {
      await expect(auctionContract1.connect(accountB).bidAuction(1, 1001)).to.be.revertedWith(
        'Bidder must be different from owner auction'
      )
    })
    it('should revert if have bidden this auction', async () => {
      const tx1 = await hdntoken.claim(10000, accountC.address)
      await tx1.wait()
      const tx2 = await hdntoken.connect(accountC).approve(auctionContract1.address, 10000)
      await tx2.wait()
      const tx3 = await auctionContract1.connect(accountC).bidAuction(1, 1001)
      await tx3.wait()
      await expect(auctionContract1.connect(accountC).bidAuction(1, 1005)).to.be.revertedWith(
        'You have bidden this auction, please withdraw your money before bidding again'
      )
    })
    it('should revert if balance of bidder is not enough', async () => {
      const tx1 = await hdntoken.claim(10000, accountC.address)
      await tx1.wait()
      const tx2 = await hdntoken.connect(accountC).approve(auctionContract1.address, 10000)
      await tx2.wait()
      const tx3 = await auctionContract1.connect(accountC).bidAuction(1, 10000)
      await tx3.wait()
      const tx4 = await hdntoken.claim(9000, accountA.address)
      await tx4.wait()
      const tx5 = await hdntoken.approve(auctionContract1.address, 100000)
      await tx5.wait()
      await expect(auctionContract1.bidAuction(1, 11000)).to.be.revertedWith(
        'Balance of bidder is not enough to bid this auction'
      )
    })
    it('should revert if bid smaller than start price', async () => {
      const tx1 = await hdntoken.claim(10000, accountC.address)
      await tx1.wait()
      const tx2 = await hdntoken.connect(accountC).approve(auctionContract1.address, 10000)
      await tx2.wait()
      await expect(auctionContract1.connect(accountC).bidAuction(1, 999)).to.be.revertedWith(
        'You must bid greater than start price'
      )
    })
    it('should revert if bid smaller than highest bid', async () => {
      const tx1 = await hdntoken.claim(10000, accountC.address)
      await tx1.wait()
      const tx2 = await hdntoken.connect(accountC).approve(auctionContract1.address, 10000)
      await tx2.wait()
      const tx3 = await auctionContract1.connect(accountC).bidAuction(1, 10000)
      await tx3.wait()
      const tx4 = await hdntoken.claim(9000, accountA.address)
      await tx4.wait()
      const tx5 = await hdntoken.approve(auctionContract1.address, 9000)
      await tx5.wait()
      await expect(auctionContract1.bidAuction(1, 9000)).to.be.revertedWith('There is already a higher or equal bid')
    })
    it('should bid auction correctly', async () => {
      const tx1 = await hdntoken.claim(10000, accountC.address)
      await tx1.wait()
      const tx2 = await hdntoken.connect(accountC).approve(auctionContract1.address, 10000)
      await tx2.wait()
      const tx3 = await auctionContract1.connect(accountC).bidAuction(1, 2000)
      await tx3.wait()

      expect(await auctionContract1.getBalanceOfRecipient()).to.be.equal(2000)
      expect(await auctionContract1.getAutionOfOrderId(1)).to.be.eql([
        accountB.address,
        accountC.address,
        ethers.BigNumber.from(2000),
        ethers.BigNumber.from(1),
        ethers.BigNumber.from(1000),
        timestamp,
        30,
        timestamp + 30,
      ])

      const tx4 = await hdntoken.claim(9000, accountA.address)
      await tx4.wait()
      const tx5 = await hdntoken.approve(auctionContract1.address, 9000)
      await tx5.wait()
      const tx6 = await auctionContract1.bidAuction(1, 5000)
      await tx6.wait()

      expect(await auctionContract1.getBalanceOfRecipient()).to.be.equal(7000)
      expect(await auctionContract1.getAutionOfOrderId(1)).to.be.eql([
        accountB.address,
        accountA.address,
        ethers.BigNumber.from(5000),
        ethers.BigNumber.from(1),
        ethers.BigNumber.from(1000),
        timestamp,
        30,
        timestamp + 30,
      ])
    })
  })
  describe('withdraw', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
  describe('removeAuction', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
  describe('cancelAuction', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
  describe('closeAuction', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
})
