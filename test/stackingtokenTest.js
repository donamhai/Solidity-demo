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
  describe('calculateReward', async () => {
    beforeEach(async () => {
      const tx1 = await token.claim(100000, accountB.address)
      await tx1.wait()

      const tx2 = await token.connect(accountB).approve(stackingtoken.address, 100000)
      await tx2.wait()

      const tx3 = await stackingtoken.connect(accountB).createStake90Days(5000)
      await tx3.wait()
    })
    it('should return if orderId = 0', async () => {
      await expect(stackingtoken.connect(accountB).calculateReward(0)).to.be.revertedWith(
        'StakeOrder must be greater than 0'
      )
    })
    it('should return if total stake of address = 0', async () => {
      await expect(stackingtoken.connect(accountC).calculateReward(1)).to.be.revertedWith('You are not staking')
    })
    it('should return if not owner of stake', async () => {
      const tx1 = await token.claim(100000, accountC.address)
      await tx1.wait()

      const tx2 = await token.connect(accountC).approve(stackingtoken.address, 100000)
      await tx2.wait()

      const tx3 = await stackingtoken.connect(accountC).createStake90Days(5000)
      await tx3.wait()
      await expect(stackingtoken.connect(accountC).calculateReward(1)).to.be.revertedWith(
        'You are not owner of stake order'
      )
    })
    it('should calculate reward correctly', async () => {
      await network.provider.send('evm_increaseTime', [15])
      expect(await stackingtoken.connect(accountB).calculateReward(1)).to.be.equal(444)
      expect(await token.balanceOf(accountB.address)).to.be.equal()
      expect(await token.balanceOf(accountD.address)).to.be.equal()
      console.log(await stackingtoken.connect(accountB).calculateReward(1))
      await network.provider.send('evm_increaseTime', [30])
      expect(await stackingtoken.connect(accountB).calculateReward(1)).to.be.equal(0)
    })
  })

  describe('', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
  describe('', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
  describe('', async () => {
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
    it('', async () => {})
  })
})