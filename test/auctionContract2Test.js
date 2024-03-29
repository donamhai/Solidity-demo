const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Auction Contract 2', async () => {
  let [accountA, accountB, accountC, accountD, accountE] = []
  let nft
  let hdntoken
  let treasure
  let marketplace
  let auctionContract2
  let address0 = '0x0000000000000000000000000000000000000000'
  let uri = 'google.com/'
  let provider

  beforeEach(async () => {
    provider = new ethers.providers.JsonRpcProvider()
    ;[accountA, accountB, accountC, accountD, accountE] = await ethers.getSigners()
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

    const AuctionContract = await ethers.getContractFactory('AuctionContract2')
    auctionContract2 = await AuctionContract.deploy(hdntoken.address, nft.address, accountD.address, 4)
    await auctionContract2.deployed()

    const setOperator1 = await nft.addOperator1(treasure.address)
    await setOperator1.wait()

    const setOperator2 = await nft.addOperator2(marketplace.address)
    await setOperator2.wait()
  })
  describe('common', async () => {
    it('getRecipientAddress should return right value', async () => {
      expect(await auctionContract2.getRecipientAddress()).to.be.equal(accountD.address)
    })
    it('getTokenAddress should return right value', async () => {
      expect(await auctionContract2.getTokenAddress()).to.be.equal(hdntoken.address)
    })
    it('getNftAddress should return right value', async () => {
      expect(await auctionContract2.getNftAddress()).to.be.equal(nft.address)
    })
    it('getFeeRate should return right value', async () => {
      expect(await auctionContract2.getFeeRate()).to.be.equal(4)
    })
    it('getAuctionOfOwner should return right value', async () => {
      expect(await auctionContract2.connect(accountB).getAuctionOfOwner()).to.be.eql([])
    })
    it('getBalanceOfRecipient should return right value', async () => {
      expect(await auctionContract2.getBalanceOfRecipient()).to.be.equal(0)
    })
    it('getTotalAuctionsOfOwner should return right value ', async () => {
      expect(await auctionContract2.getTotalAuctionsOfOwner(accountB.address)).to.be.equal(0)
    })
    it('getAutionOfOrderId should return right value', async () => {
      expect(await auctionContract2.getAutionOfOrderId(1)).to.be.eql([
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
      await expect(auctionContract2.setRecipientAddress(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should return if not admin', async () => {
      await expect(auctionContract2.connect(accountB).setRecipientAddress(accountB.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should set recipient address correctly', async () => {
      const tx1 = await auctionContract2.setRecipientAddress(accountC.address)
      await tx1.wait()

      expect(await auctionContract2.getRecipientAddress()).to.be.equal(accountC.address)
    })
  })
  describe('setNftAddress', async () => {
    it('should return if address 0', async () => {
      await expect(auctionContract2.setNftAddress(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should revert if not admin', async () => {
      await expect(auctionContract2.connect(accountB).setNftAddress(accountC.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should revert if not contract', async () => {
      await expect(auctionContract2.setNftAddress(accountC.address)).to.be.revertedWith(
        'You must input nft contract address'
      )
    })
    it('should set nft address correctly', async () => {
      const NFT2 = await ethers.getContractFactory('RelipaNFT')
      const nft2 = await NFT2.deploy('9999', '2')
      await nft2.deployed()

      const tx1 = await auctionContract2.setNftAddress(nft2.address)
      await tx1.wait()

      expect(await auctionContract2.getNftAddress()).to.be.equal(nft2.address)
    })
  })
  describe('setTokenAddress', async () => {
    it('should return if address 0', async () => {
      await expect(auctionContract2.setTokenAddress(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should return if not admin', async () => {
      await expect(auctionContract2.connect(accountB).setTokenAddress(accountC.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should return if not contract', async () => {
      await expect(auctionContract2.setTokenAddress(accountC.address)).to.be.revertedWith(
        'You must input token address'
      )
    })
    it('should set token address correctly', async () => {
      const Token2 = await ethers.getContractFactory('HdnToken')
      const token2 = await Token2.deploy()
      await token2.deployed()

      const tx1 = await auctionContract2.setTokenAddress(token2.address)
      await tx1.wait()

      expect(await auctionContract2.getTokenAddress()).to.be.equal(token2.address)
    })
  })
  describe('setFeeRate', async () => {
    it('should return if not admin', async () => {
      await expect(auctionContract2.connect(accountB).setFeeRate(8)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should return if feerate = 0', async () => {
      await expect(auctionContract2.setFeeRate(0)).to.be.revertedWith('Fee Rate must among 0 to 100')
    })
    it('should return if feerate > 100', async () => {
      await expect(auctionContract2.setFeeRate(101)).to.be.revertedWith('Fee Rate must among 0 to 100')
    })
    it('should set feerate correctly', async () => {
      const tx1 = await auctionContract2.setFeeRate(8)
      await tx1.wait()

      expect(await auctionContract2.getFeeRate()).to.be.equal(8)
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
      await expect(auctionContract2.connect(accountB).createAuction(0, 0, 10)).to.be.revertedWith('Invalid tokenId')
    })
    it('should return if not owner of token', async () => {
      await expect(auctionContract2.connect(accountC).createAuction(1, 0, 10)).to.be.revertedWith(
        'Sender is not owner of token'
      )
    })
    it('should return if The contract is unauthorized to manage this token', async () => {
      await expect(auctionContract2.connect(accountB).createAuction(1, 0, 10)).to.be.revertedWith(
        'The contract is unauthorized to manage this token'
      )
    })
    it('should return if start price < 1000', async () => {
      const tx1 = await nft.connect(accountB).approve(auctionContract2.address, 1)
      await tx1.wait()
      await expect(auctionContract2.connect(accountB).createAuction(1, 999, 10)).to.be.revertedWith(
        'Price must be greater than 1000'
      )
    })
    it('should return if duration  = 0', async () => {
      const tx1 = await nft.connect(accountB).approve(auctionContract2.address, 1)
      await tx1.wait()
      await expect(auctionContract2.connect(accountB).createAuction(1, 1000, 0)).to.be.revertedWith(
        'Duration auction must be greater than 0'
      )
    })
    it('should return if not operator2', async () => {
      const tx1 = await nft.connect(accountB).approve(auctionContract2.address, 1)
      await tx1.wait()
      await expect(auctionContract2.connect(accountB).createAuction(1, 1000, 10)).to.be.revertedWith(
        'Caller is not the operator2'
      )
    })
    it('should create aution correctly', async () => {
      const setOperator3 = await nft.addOperator2(auctionContract2.address)
      await setOperator3.wait()
      const tx1 = await nft.connect(accountB).approve(auctionContract2.address, 1)
      await tx1.wait()
      const tx2 = await auctionContract2.connect(accountB).createAuction(1, 1000, 20)
      const txReceipt2 = await tx2.wait()
      const timestamp2 = (await ethers.provider.getBlock(txReceipt2.blockNumber)).timestamp
      expect(await auctionContract2.connect(accountB).getAuctionOfOwner()).to.be.eql([ethers.BigNumber.from(1)])
      expect(await auctionContract2.getTotalAuctionsOfOwner(accountB.address)).to.be.equal(1)
      expect(await auctionContract2.getAutionOfOrderId(1)).to.be.eql([
        accountB.address,
        address0,
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(1),
        ethers.BigNumber.from(1000),
        timestamp2,
        20,
        timestamp2 + 20,
      ])

      const tx3 = await nft.connect(accountB).approve(auctionContract2.address, 2)
      await tx3.wait()
      const tx4 = await auctionContract2.connect(accountB).createAuction(2, 2000, 30)
      const txReceipt4 = await tx4.wait()
      const timestamp4 = (await ethers.provider.getBlock(txReceipt4.blockNumber)).timestamp
      expect(await auctionContract2.connect(accountB).getAuctionOfOwner()).to.be.eql([
        ethers.BigNumber.from(1),
        ethers.BigNumber.from(2),
      ])
      expect(await auctionContract2.getTotalAuctionsOfOwner(accountB.address)).to.be.equal(2)
      expect(await auctionContract2.getAutionOfOrderId(2)).to.be.eql([
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
      const setOperator3 = await nft.addOperator2(auctionContract2.address)
      await setOperator3.wait()
      const tx3 = await nft.connect(accountB).approve(auctionContract2.address, 1)
      await tx3.wait()
      const tx4 = await auctionContract2.connect(accountB).createAuction(1, 1000, 20)
      const txReceipt4 = await tx4.wait()
      timestamp = (await ethers.provider.getBlock(txReceipt4.blockNumber)).timestamp
    })
    it('should return if auction order id = 0', async () => {
      await expect(auctionContract2.connect(accountC).bidAuction(0, 1001)).to.be.revertedWith(
        'Invalid auction order id'
      )
    })
    it('should return if bid time > = end time', async () => {
      await network.provider.send('evm_increaseTime', [30])
      await expect(auctionContract2.connect(accountC).bidAuction(1, 1001)).to.be.revertedWith(
        'The auction has already ended'
      )
    })
    it('should revert if bidder is the owner of auction', async () => {
      await expect(auctionContract2.connect(accountB).bidAuction(1, 1001)).to.be.revertedWith(
        'Bidder must be different from owner auction'
      )
    })
    it('should revert if balance of bidder is not enough', async () => {
      const tx1 = await hdntoken.claim(10000, accountC.address)
      await tx1.wait()
      const tx2 = await hdntoken.connect(accountC).approve(auctionContract2.address, 100000)
      await tx2.wait()
      const tx3 = await auctionContract2.connect(accountC).bidAuction(1, 9000)
      await tx3.wait()
      await expect(auctionContract2.connect(accountC).bidAuction(1, 2000)).to.be.revertedWith(
        'Balance of bidder is not enough to increase bid this auction'
      )
    })
    it('should revert if bid smaller than start price', async () => {
      const tx1 = await hdntoken.claim(10000, accountC.address)
      await tx1.wait()
      const tx2 = await hdntoken.connect(accountC).approve(auctionContract2.address, 10000)
      await tx2.wait()
      await expect(auctionContract2.connect(accountC).bidAuction(1, 999)).to.be.revertedWith(
        'You must bid greater than start price'
      )
    })
    it('should revert if bid smaller than highest bid', async () => {
      const tx1 = await hdntoken.claim(10000, accountC.address)
      await tx1.wait()
      const tx2 = await hdntoken.connect(accountC).approve(auctionContract2.address, 10000)
      await tx2.wait()
      const tx3 = await auctionContract2.connect(accountC).bidAuction(1, 10000)
      await tx3.wait()
      const tx4 = await hdntoken.claim(9000, accountA.address)
      await tx4.wait()
      const tx5 = await hdntoken.approve(auctionContract2.address, 9000)
      await tx5.wait()
      await expect(auctionContract2.bidAuction(1, 9000)).to.be.revertedWith('There is already a higher or equal bid')
    })
    it('should bid auction correctly', async () => {
      const tx1 = await hdntoken.claim(10000, accountC.address)
      await tx1.wait()
      const tx2 = await hdntoken.connect(accountC).approve(auctionContract2.address, 10000)
      await tx2.wait()
      const tx3 = await auctionContract2.connect(accountC).bidAuction(1, 2000)
      await tx3.wait()

      expect(await auctionContract2.getBalanceOfRecipient()).to.be.equal(2000)
      expect(await auctionContract2.getAutionOfOrderId(1)).to.be.eql([
        accountB.address,
        accountC.address,
        ethers.BigNumber.from(2000),
        ethers.BigNumber.from(1),
        ethers.BigNumber.from(1000),
        timestamp,
        20,
        timestamp + 20,
      ])

      const tx4 = await hdntoken.claim(9000, accountA.address)
      await tx4.wait()
      const tx5 = await hdntoken.approve(auctionContract2.address, 9000)
      await tx5.wait()
      const tx6 = await auctionContract2.bidAuction(1, 5000)
      await tx6.wait()

      expect(await auctionContract2.getBalanceOfRecipient()).to.be.equal(7000)
      expect(await auctionContract2.getAutionOfOrderId(1)).to.be.eql([
        accountB.address,
        accountA.address,
        ethers.BigNumber.from(5000),
        ethers.BigNumber.from(1),
        ethers.BigNumber.from(1000),
        timestamp,
        20,
        timestamp + 20,
      ])

      const tx7 = await auctionContract2.connect(accountC).bidAuction(1, 4000)
      await tx7.wait()

      expect(await auctionContract2.getBalanceOfRecipient()).to.be.equal(11000)
      expect(await auctionContract2.getAutionOfOrderId(1)).to.be.eql([
        accountB.address,
        accountC.address,
        ethers.BigNumber.from(6000),
        ethers.BigNumber.from(1),
        ethers.BigNumber.from(1000),
        timestamp,
        20,
        timestamp + 20,
      ])
    })
  })
  describe('withdraw', async () => {
    beforeEach(async () => {
      const tx1 = await treasure.claimTreasure(2, accountB.address)
      await tx1.wait()
      const tx2 = await treasure.connect(accountB).unbox(2)
      await tx2.wait()
      const setOperator3 = await nft.addOperator2(auctionContract2.address)
      await setOperator3.wait()
      const tx3 = await nft.connect(accountB).approve(auctionContract2.address, 1)
      await tx3.wait()
      const tx4 = await auctionContract2.connect(accountB).createAuction(1, 1000, 20)
      await tx4.wait()
      const tx5 = await hdntoken.claim(9000, accountC.address)
      await tx5.wait()
      const tx6 = await hdntoken.connect(accountC).approve(auctionContract2.address, 9000)
      await tx6.wait()
      const tx7 = await auctionContract2.connect(accountC).bidAuction(1, 5000)
      await tx7.wait()
      const tx8 = await hdntoken.connect(accountD).approve(auctionContract2.address, 100000)
      await tx8.wait()
      expect(await hdntoken.balanceOf(accountC.address)).to.be.equal(4000)
      expect(await hdntoken.balanceOf(accountD.address)).to.be.equal(5000)
    })
    it('should revert if auction order id = 0', async () => {
      await expect(auctionContract2.connect(accountC).withdraw(0)).to.be.revertedWith('Invalid auction order id')
    })
    it('should revert if you do not bid this aution', async () => {
      await expect(auctionContract2.connect(accountE).withdraw(1)).to.be.revertedWith('You do not bid this auction')
    })
    it('should revert if your bid is the highest price', async () => {
      await expect(auctionContract2.connect(accountC).withdraw(1)).to.be.revertedWith(
        'Your bid is the highest price, can not withdraw'
      )
    })
    it('should revert if balance of Aution Market not enough to withdraw', async () => {
      const tx1 = await hdntoken.claim(9000, accountE.address)
      await tx1.wait()
      const tx2 = await hdntoken.connect(accountE).approve(auctionContract2.address, 9000)
      await tx2.wait()
      const tx3 = await auctionContract2.connect(accountE).bidAuction(1, 6000)
      await tx3.wait()
      const tx4 = await hdntoken.connect(accountD).transfer(accountA.address, 10000)
      await tx4.wait()
      await expect(auctionContract2.connect(accountC).withdraw(1)).to.be.revertedWith(
        'Balance of Auction Market not enough to withdraw'
      )
    })
    it('should withdraw correctly', async () => {
      const tx1 = await hdntoken.claim(9000, accountE.address)
      await tx1.wait()
      const tx2 = await hdntoken.connect(accountE).approve(auctionContract2.address, 9000)
      await tx2.wait()
      const tx3 = await auctionContract2.connect(accountE).bidAuction(1, 6000)
      await tx3.wait()
      expect(await hdntoken.balanceOf(accountD.address)).to.be.equal(11000)
      const tx4 = await auctionContract2.connect(accountC).withdraw(1)
      await tx4.wait()
      expect(await hdntoken.balanceOf(accountD.address)).to.be.equal(6000)
      expect(await hdntoken.balanceOf(accountC.address)).to.be.equal(9000)
      await expect(auctionContract2.connect(accountE).withdraw(1)).to.be.revertedWith(
        'Your bid is the highest price, can not withdraw'
      )
    })
  })
  describe('cancelAuction', async () => {
    beforeEach(async () => {
      const tx1 = await treasure.claimTreasure(2, accountB.address)
      await tx1.wait()
      const tx2 = await treasure.connect(accountB).unbox(2)
      await tx2.wait()
      const setOperator3 = await nft.addOperator2(auctionContract2.address)
      await setOperator3.wait()
      const tx3 = await nft.connect(accountB).approve(auctionContract2.address, 1)
      await tx3.wait()
      const tx4 = await auctionContract2.connect(accountB).createAuction(1, 3000, 20)
      await tx4.wait()
      const tx5 = await hdntoken.claim(9000, accountC.address)
      await tx5.wait()
      const tx6 = await hdntoken.connect(accountC).approve(auctionContract2.address, 9000)
      await tx6.wait()
      const tx7 = await auctionContract2.connect(accountC).bidAuction(1, 5000)
      await tx7.wait()
      const tx8 = await hdntoken.connect(accountD).approve(auctionContract2.address, 100000)
      await tx8.wait()
      expect(await hdntoken.balanceOf(accountC.address)).to.be.equal(4000)
      expect(await hdntoken.balanceOf(accountD.address)).to.be.equal(5000)
    })
    it('should revert if auction order id = 0', async () => {
      await expect(auctionContract2.connect(accountB).cancelAuction(0)).to.be.revertedWith('Invalid auction order id')
    })
    it('should revert if the auction has already ended', async () => {
      await network.provider.send('evm_increaseTime', [30])
      await expect(auctionContract2.connect(accountB).cancelAuction(1)).to.be.revertedWith(
        'The auction has already ended'
      )
    })
    it('should revert if not owner of this auction', async () => {
      await expect(auctionContract2.connect(accountC).cancelAuction(1)).to.be.revertedWith(
        'You are not owner of this auction'
      )
    })
    it('should revert if balance of account B is less than starting price', async () => {
      const tx1 = await hdntoken.claim(2000, accountB.address)
      await tx1.wait()
      const tx2 = await hdntoken.connect(accountB).approve(auctionContract2.address, 9000)
      await tx2.wait()
      await expect(auctionContract2.connect(accountB).cancelAuction(1)).to.be.revertedWith(
        'If you cancel the auction, the starting price of auction will be lost'
      )
    })
    it('should cancel auction correctly', async () => {
      const tx1 = await hdntoken.claim(9000, accountB.address)
      await tx1.wait()
      const tx2 = await hdntoken.connect(accountB).approve(auctionContract2.address, 9000)
      await tx2.wait()
      const tx3 = await auctionContract2.connect(accountB).cancelAuction(1)
      await tx3.wait()
      expect(await auctionContract2.connect(accountB).getTotalAuctionsOfOwner(accountB.address)).to.be.equal(0)
      expect(await auctionContract2.getAutionOfOrderId(1)).to.be.eql([
        address0,
        address0,
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(0),
        0,
        0,
        0,
      ])
      expect(await hdntoken.balanceOf(accountB.address)).to.be.equal(6000)
      const tx4 = await auctionContract2.connect(accountC).withdraw(1)
      await tx4.wait()
      expect(await hdntoken.balanceOf(accountC.address)).to.be.equal(9000)
      expect(await hdntoken.balanceOf(accountD.address)).to.be.equal(3000)
    })
  })
  describe('closeAuction', async () => {
    beforeEach(async () => {
      const tx1 = await treasure.claimTreasure(2, accountB.address)
      await tx1.wait()
      const tx2 = await treasure.connect(accountB).unbox(2)
      await tx2.wait()
      const setOperator3 = await nft.addOperator2(auctionContract2.address)
      await setOperator3.wait()
      const tx3 = await nft.connect(accountB).approve(auctionContract2.address, 1)
      await tx3.wait()
      const tx4 = await auctionContract2.connect(accountB).createAuction(1, 3000, 20)
      await tx4.wait()
      const tx5 = await hdntoken.claim(9000, accountC.address)
      await tx5.wait()
      const tx6 = await hdntoken.connect(accountC).approve(auctionContract2.address, 9000)
      await tx6.wait()
      const tx7 = await auctionContract2.connect(accountC).bidAuction(1, 5000)
      await tx7.wait()
      const tx8 = await hdntoken.connect(accountD).approve(auctionContract2.address, 100000)
      await tx8.wait()
      expect(await hdntoken.balanceOf(accountC.address)).to.be.equal(4000)
      expect(await hdntoken.balanceOf(accountD.address)).to.be.equal(5000)
    })
    it('should revert if auction order id = 0', async () => {
      await expect(auctionContract2.connect(accountB).closeAuction(0)).to.be.revertedWith('Invalid auction order id')
    })
    it('should revert if the auction has already ended', async () => {
      await network.provider.send('evm_increaseTime', [10])
      await expect(auctionContract2.connect(accountB).closeAuction(1)).to.be.revertedWith(
        'The auction has not ended yet'
      )
    })
    it('should revert if not owner of this auction', async () => {
      await network.provider.send('evm_increaseTime', [30])
      await expect(auctionContract2.connect(accountC).closeAuction(1)).to.be.revertedWith(
        'You are not owner of this auction'
      )
    })
    it('should revert if balance of Aution Market not enough to withdraw', async () => {
      const tx4 = await hdntoken.connect(accountD).transfer(accountA.address, 4000)
      await tx4.wait()
      await network.provider.send('evm_increaseTime', [30])
      await expect(auctionContract2.connect(accountB).closeAuction(1)).to.be.revertedWith(
        'Balance of Auction Market not enough to withdraw'
      )
    })
    it('should close auction correctly', async () => {
      await network.provider.send('evm_increaseTime', [20])
      const tx1 = await auctionContract2.connect(accountB).closeAuction(1)
      await tx1.wait()
      expect(await hdntoken.balanceOf(accountC.address)).to.be.equal(4000)
      expect(await nft.balanceOf(accountC.address)).to.be.equal(1)
      expect(await nft.ownerOf(1)).to.be.equal(accountC.address)
      expect(await hdntoken.balanceOf(accountD.address)).to.be.equal(200)
      expect(await hdntoken.balanceOf(accountB.address)).to.be.equal(4800)

      const tx2 = await nft.connect(accountB).approve(auctionContract2.address, 2)
      await tx2.wait()
      const tx3 = await auctionContract2.connect(accountB).createAuction(2, 3000, 20)
      await tx3.wait()
      expect(await nft.ownerOf(2)).to.be.equal(auctionContract2.address)
      expect(await nft.balanceOf(accountB.address)).to.be.equal(0)
      await network.provider.send('evm_increaseTime', [30])
      const tx4 = await auctionContract2.connect(accountB).closeAuction(2)
      await tx4.wait()
      expect(await nft.balanceOf(accountB.address)).to.be.equal(1)
      expect(await nft.ownerOf(2)).to.be.equal(accountB.address)
    })
  })
})
