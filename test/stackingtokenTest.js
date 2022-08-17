const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Stacking token', async () => {
  let [accountA, accountB, accountC, accountD] = []
  let token
  let stackingtoken
  let address0 = '0x0000000000000000000000000000000000000000'

  beforeEach(async () => {
    ;[accountA, accountB, accountC, accountD] = await ethers.getSigners()
    const Token = await ethers.getContractFactory('HdnToken')
    token = await Token.deploy()
    await token.deployed()

    const StakingToken = await ethers.getContractFactory('StakingTokenContract')
    stackingtoken = await StakingToken.deploy(token.address, accountD.address)
    await stackingtoken.deployed()
  })
  describe('common', async () => {
    it('getDailyAPY90 should return right value', async () => {
      expect(await stackingtoken.getDailyAPY90()).to.be.equal(25)
    })
    it('getPeriodStaking should return right value', async () => {
      expect(await stackingtoken.getPeriodStaking()).to.be.equal(90)
    })
    it('getTimeCooldown should return right value', async () => {
      expect(await stackingtoken.getTimeCooldown()).to.be.equal(10)
    })
    it('getRecipientAddress should return right value', async () => {
      expect(await stackingtoken.getRecipientAddress()).to.be.equal(accountD.address)
    })
    it('getTokenAddress should return right value', async () => {
      expect(await stackingtoken.getTokenAddress()).to.be.equal(token.address)
    })
    it('getBalanceOfRecipient should return right value', async () => {
      expect(await stackingtoken.getBalanceOfRecipient()).to.be.equal(0)
    })
    it('getStakeOfBalance should return right value', async () => {
      expect(await stackingtoken.getStakeOfBalance(accountB.address)).to.be.equal(0)
    })
    it('getTotalStakesOFAddress should return right value', async () => {
      expect(await stackingtoken.getTotalStakesOFAddress(accountB.address)).to.be.equal(0)
    })
    it('getStakeOfOrderId should return right value', async () => {
      expect(await stackingtoken.getStakeOfOrderId(1)).to.be.eql([
        address0,
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(0),
        0,
        0,
        0,
        0,
      ])
    })
  })
  describe('setDailyAPY90', async () => {
    it('should return if value = 0', async () => {
      await expect(stackingtoken.setDailyAPY90(0)).to.be.revertedWith(
        'APY value has to be more than 0, try 30 for (0.3% daily) instead'
      )
    })
    it('should return if not admin', async () => {
      await expect(stackingtoken.connect(accountB).setDailyAPY90(60)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should set daily apy 90 correctly', async () => {
      const tx1 = await stackingtoken.setDailyAPY90(60)
      await tx1.wait()
      expect(await stackingtoken.getDailyAPY90()).to.be.equal(60)
    })
  })
  describe('setRecipientAddress', async () => {
    it('should return if address 0', async () => {
      await expect(stackingtoken.setRecipientAddress(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should return if not admin', async () => {
      await expect(stackingtoken.connect(accountB).setRecipientAddress(accountC.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should set recipient address correctly', async () => {
      const tx1 = await stackingtoken.setRecipientAddress(accountC.address)
      await tx1.wait()

      expect(await stackingtoken.getRecipientAddress()).to.be.equal(accountC.address)
    })
  })

  describe('setTokenAddress', async () => {
    it('should return if address 0', async () => {
      await expect(stackingtoken.setTokenAddress(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should return if not admin', async () => {
      await expect(stackingtoken.connect(accountB).setTokenAddress(accountC.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should return if not contract', async () => {
      await expect(stackingtoken.setTokenAddress(accountC.address)).to.be.revertedWith('You must input token address')
    })
    it('should set token address correctly', async () => {
      const Token2 = await ethers.getContractFactory('HdnToken')
      const token2 = await Token2.deploy()
      await token2.deployed()

      const tx1 = await stackingtoken.setTokenAddress(token2.address)
      await tx1.wait()

      expect(await stackingtoken.getTokenAddress()).to.be.equal(token2.address)
    })
  })

  describe('setCooldownTime', async () => {
    it('should return if new cooldown = 0', async () => {
      await expect(stackingtoken.setCooldownTime(0)).to.be.revertedWith('Please input new cooldown time > 0')
    })
    it('should return if not admin', async () => {
      await expect(stackingtoken.connect(accountB).setCooldownTime(15)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should set cooldown correctly', async () => {
      const tx1 = await stackingtoken.setCooldownTime(50)
      await tx1.wait()

      expect(await stackingtoken.getTimeCooldown()).to.be.equal(50)
    })
  })
  describe('createStake90Days', async () => {
    it('should return if stake amount  = 0', async () => {
      await expect(stackingtoken.connect(accountB).createStake90Days(0)).to.be.revertedWith(
        'Amount must be greater than 0'
      )
    })
    it('should revert if balance of msg.sender < stake amount', async () => {
      expect(await token.balanceOf(accountB.address)).to.be.equal(0)
      await expect(stackingtoken.connect(accountB).createStake90Days(5000)).to.be.revertedWith(
        'You are not enough token to stake'
      )
    })
    it('should create stake 90 days correctly', async () => {
      const tx1 = await token.claim(100000, accountB.address)
      await tx1.wait()

      const tx2 = await token.connect(accountB).approve(stackingtoken.address, 100000)
      await tx2.wait()

      const tx3 = await stackingtoken.connect(accountB).createStake90Days(5000)
      const txReceipt3 = await tx3.wait()
      const timestamp3 = (await ethers.provider.getBlock(txReceipt3.blockNumber)).timestamp

      expect(await stackingtoken.getStakeOfBalance(accountB.address)).to.be.equal(5000)
      expect(await token.balanceOf(accountB.address)).to.be.equal(95000)
      expect(await token.balanceOf(accountD.address)).to.be.equal(5000)
      expect(await stackingtoken.getTotalStakesOFAddress(accountB.address)).to.be.equal(1)
      expect(await stackingtoken.getStakeOfOrderId(1)).to.be.eql([
        accountB.address,
        ethers.BigNumber.from(5000),
        ethers.BigNumber.from(25),
        timestamp3,
        timestamp3,
        timestamp3 + 90,
        timestamp3 + 10,
      ])

      const tx4 = await stackingtoken.connect(accountB).createStake90Days(6000)
      const txReceipt4 = await tx4.wait()
      const timestamp4 = (await ethers.provider.getBlock(txReceipt4.blockNumber)).timestamp

      expect(await stackingtoken.getStakeOfBalance(accountB.address)).to.be.equal(11000)
      expect(await token.balanceOf(accountB.address)).to.be.equal(89000)
      expect(await token.balanceOf(accountD.address)).to.be.equal(11000)
      expect(await stackingtoken.getTotalStakesOFAddress(accountB.address)).to.be.equal(2)
      expect(await stackingtoken.getStakeOfOrderId(2)).to.be.eql([
        accountB.address,
        ethers.BigNumber.from(6000),
        ethers.BigNumber.from(25),
        timestamp4,
        timestamp4,
        timestamp4 + 90,
        timestamp4 + 10,
      ])

      const tx5 = await stackingtoken.connect(accountB).createStake90Days(7000)
      const txReceipt5 = await tx5.wait()
      const timestamp5 = (await ethers.provider.getBlock(txReceipt5.blockNumber)).timestamp

      expect(await stackingtoken.getStakeOfBalance(accountB.address)).to.be.equal(18000)
      expect(await token.balanceOf(accountB.address)).to.be.equal(82000)
      expect(await token.balanceOf(accountD.address)).to.be.equal(18000)
      expect(await stackingtoken.getTotalStakesOFAddress(accountB.address)).to.be.equal(3)
      expect(await stackingtoken.getStakeOfOrderId(3)).to.be.eql([
        accountB.address,
        ethers.BigNumber.from(7000),
        ethers.BigNumber.from(25),
        timestamp5,
        timestamp5,
        timestamp5 + 90,
        timestamp5 + 10,
      ])
    })
  })

  describe('withdrawReward', async () => {
    beforeEach(async () => {
      const tx1 = await token.claim(100000, accountB.address)
      await tx1.wait()

      const tx2 = await token.connect(accountB).approve(stackingtoken.address, 100000)
      await tx2.wait()

      const tx3 = await stackingtoken.connect(accountB).createStake90Days(5000)
      await tx3.wait()

      const tx4 = await token.connect(accountD).approve(stackingtoken.address, 100000)
      await tx4.wait()
    })
    it('should return if orderId = 0', async () => {
      await expect(stackingtoken.connect(accountB).withdrawReward(0)).to.be.revertedWith(
        'StakeOrder must be greater than 0'
      )
    })
    it('should return if not owner of stake', async () => {
      await network.provider.send('evm_increaseTime', [15])
      const tx1 = await token.claim(100000, accountC.address)
      await tx1.wait()

      const tx2 = await token.connect(accountC).approve(stackingtoken.address, 100000)
      await tx2.wait()

      const tx3 = await stackingtoken.connect(accountC).createStake90Days(5000)
      await tx3.wait()

      await expect(stackingtoken.connect(accountC).withdrawReward(1)).to.be.revertedWith(
        'You are not owner of stake order'
      )
    })
    it('should revert if time of next withdrawl is not yet', async () => {
      await expect(stackingtoken.connect(accountB).withdrawReward(1)).to.be.revertedWith(
        'The next withdrawal is not yet'
      )
    })
    it('should revert if balance of recipient is not enough to pay reward', async () => {
      const tx1 = await token.connect(accountD).transfer(accountC.address, 5000)
      await tx1.wait()

      await network.provider.send('evm_increaseTime', [15])
      await expect(stackingtoken.connect(accountB).withdrawReward(1)).to.be.revertedWith(
        'Balance is not enough to pay reward'
      )
    })
    it('should revert if reward = 0', async () => {
      await network.provider.send('evm_increaseTime', [100])
      const tx1 = await stackingtoken.connect(accountB).withdrawReward(1)
      await tx1.wait()

      await network.provider.send('evm_increaseTime', [11])
      await expect(stackingtoken.connect(accountB).withdrawReward(1)).to.be.revertedWith(
        'You dont have any reward to withdraw'
      )
    })

    it('should withdraw reward correctly', async () => {
      await network.provider.send('evm_increaseTime', [15])
      const tx1 = await stackingtoken.connect(accountB).withdrawReward(1)
      await tx1.wait()

      expect(await token.balanceOf(accountB.address)).to.be.equal(95192)
      expect(await token.balanceOf(accountD.address)).to.be.equal(4808)

      await network.provider.send('evm_increaseTime', [100])
      const tx2 = await stackingtoken.connect(accountB).withdrawReward(1)
      await tx2.wait()

      expect(await token.balanceOf(accountB.address)).to.be.equal(96080)
      expect(await token.balanceOf(accountD.address)).to.be.equal(3920)

      await network.provider.send('evm_increaseTime', [11])
      await expect(stackingtoken.connect(accountB).withdrawReward(1)).to.be.revertedWith(
        'You dont have any reward to withdraw'
      )
    })
  })
  describe('withdrawAllRewards', async () => {
    beforeEach(async () => {
      const tx1 = await token.claim(100000, accountB.address)
      await tx1.wait()

      const tx2 = await token.connect(accountB).approve(stackingtoken.address, 100000)
      await tx2.wait()

      const tx3 = await stackingtoken.connect(accountB).createStake90Days(5000)
      await tx3.wait()

      const tx4 = await stackingtoken.connect(accountB).createStake90Days(6000)
      await tx4.wait()

      const tx5 = await stackingtoken.connect(accountB).createStake90Days(7000)
      await tx5.wait()

      const tx6 = await token.connect(accountD).approve(stackingtoken.address, 100000)
      await tx6.wait()
    })
    it('should revert if not stacking', async () => {
      await expect(stackingtoken.connect(accountC).withdrawAllRewards()).to.be.revertedWith('You are not staking')
    })
    it('should revert if time of next withdrawl is not yet', async () => {
      await expect(stackingtoken.connect(accountB).withdrawAllRewards()).to.be.revertedWith(
        'The next withdrawal is not yet'
      )
    })
    it('should revert if balance of recipient is not enough to pay reward', async () => {
      const tx1 = await token.connect(accountD).transfer(accountC.address, 18000)
      await tx1.wait()

      await network.provider.send('evm_increaseTime', [15])
      await expect(stackingtoken.connect(accountB).withdrawAllRewards()).to.be.revertedWith(
        'Balance is not enough to pay reward'
      )
    })
    it('should revert if all reward = 0', async () => {
      await network.provider.send('evm_increaseTime', [100])
      const tx1 = await stackingtoken.connect(accountB).withdrawAllRewards()
      await tx1.wait()
      await network.provider.send('evm_increaseTime', [10])
      await expect(stackingtoken.connect(accountB).withdrawAllRewards()).to.be.revertedWith(
        'You dont have any reward to withdraw'
      )
    })
    it('should withdraw all reward correctly', async () => {
      await network.provider.send('evm_increaseTime', [15])
      const tx1 = await stackingtoken.connect(accountB).withdrawAllRewards()
      await tx1.wait()

      expect(await token.balanceOf(accountB.address)).to.be.equal(82743)
      expect(await token.balanceOf(accountD.address)).to.be.equal(17257)

      await network.provider.send('evm_increaseTime', [100])
      const tx2 = await stackingtoken.connect(accountB).withdrawAllRewards()
      await tx2.wait()

      expect(await token.balanceOf(accountB.address)).to.be.equal(85960)
      expect(await token.balanceOf(accountD.address)).to.be.equal(14040)

      await network.provider.send('evm_increaseTime', [10])
      await expect(stackingtoken.connect(accountB).withdrawAllRewards()).to.be.revertedWith(
        'You dont have any reward to withdraw'
      )
    })
  })
  describe('releaseStake90Days', async () => {
    beforeEach(async () => {
      const tx1 = await token.claim(100000, accountB.address)
      await tx1.wait()

      const tx2 = await token.connect(accountB).approve(stackingtoken.address, 100000)
      await tx2.wait()

      const tx3 = await stackingtoken.connect(accountB).createStake90Days(5000)
      await tx3.wait()

      const tx4 = await stackingtoken.connect(accountB).createStake90Days(6000)
      await tx4.wait()

      const tx5 = await token.connect(accountD).approve(stackingtoken.address, 100000)
      await tx5.wait()
    })
    it('should return if orderId = 0', async () => {
      await expect(stackingtoken.connect(accountB).releaseStake90Days(0)).to.be.revertedWith(
        'StakeOrder must be greater than 0'
      )
    })
    it('should revert if not stacking', async () => {
      await expect(stackingtoken.connect(accountC).releaseStake90Days(1)).to.be.revertedWith('You are not staking')
    })
    it('should return if time release stake is not enough', async () => {
      await expect(stackingtoken.connect(accountB).releaseStake90Days(1)).to.be.revertedWith(
        'Time release stake is not enough'
      )
    })
    it('should return if balance of recipient is not enough to release stake', async () => {
      const tx1 = await token.connect(accountD).transfer(accountC.address, 10000)
      await tx1.wait()

      await network.provider.send('evm_increaseTime', [100])
      await expect(stackingtoken.connect(accountB).releaseStake90Days(1)).to.be.revertedWith(
        'Balance of recipient is not enough to release stake'
      )
    })
    it('should release stake 90day correctly', async () => {
      expect(await stackingtoken.getTotalStakesOFAddress(accountB.address)).to.be.equal(2)
      await network.provider.send('evm_increaseTime', [100])
      const tx1 = await stackingtoken.connect(accountB).releaseStake90Days(1)
      await tx1.wait()

      expect(await stackingtoken.getTotalStakesOFAddress(accountB.address)).to.be.equal(1)
      expect(await token.balanceOf(accountB.address)).to.be.equal(95080)
      expect(await token.balanceOf(accountD.address)).to.be.equal(4920)
      expect(await stackingtoken.getStakeOfOrderId(1)).to.be.eql([
        address0,
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(0),
        0,
        0,
        0,
        0,
      ])
    })
  })
})
