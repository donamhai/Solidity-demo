const { expect } = require('chai')
const { ethers, network } = require('hardhat')

describe('Bank money', function () {
  let [accountA, accountB, accountC, accountD] = []
  let bank
  let token
  let address0 = '0x0000000000000000000000000000000000000000'
  beforeEach(async () => {
    ;[accountA, accountB, accountC, accountD] = await ethers.getSigners()

    const Token = await ethers.getContractFactory('HdnToken')
    token = await Token.deploy()
    await token.deployed()

    const claimToken = await token.claim(100000, accountB.address)
    await claimToken.wait()

    const Bank = await ethers.getContractFactory('BankMoney')
    bank = await Bank.deploy(token.address, accountD.address, '20000', '10')
    await bank.deployed()

    const ApproveToken1 = await token.connect(accountB).approve(bank.address, 100000)
    await ApproveToken1.wait()
    const ApproveToken2 = await token.connect(accountD).approve(bank.address, 10000000)
    await ApproveToken2.wait()
  })

  describe('common', function () {
    it('getRecieveWallet should return right value', async () => {
      expect(await bank.getRecieveWallet()).to.be.equal(accountD.address)
    })
    it('getlimitWithdraw should return right value', async () => {
      expect(await bank.getlimitWithdraw()).to.be.equal(20000)
    })
    it('getTimeCoolDown should return right value', async () => {
      expect(await bank.getTimeCoolDown()).to.be.equal(10)
    })
    it('getTokenAddress should return right value', async () => {
      expect(await bank.getTokenAddress()).to.be.equal(token.address)
    })
    it('Balance of account B and C should return right value', async () => {
      expect(await bank.getBalanceOf(accountB.address)).to.be.equal(0)
      expect(await bank.getBalanceOf(accountC.address)).to.be.equal(0)
      expect(await bank.getBalanceOf(accountD.address)).to.be.equal(0)
    })
  })
  describe('setRecieveWallet', function () {
    it('should revert if address is zero address', async () => {
      await expect(bank.setRecieveWallet(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should set recieve wallet correctly', async () => {
      const tx1 = await bank.setRecieveWallet(accountB.address)
      await tx1.wait()
      expect(await bank.getRecieveWallet()).to.be.equal(accountB.address)
    })
  })
  describe('setLimitWithdraw', function () {
    it('should revert if amount = 0', async () => {
      await expect(bank.setLimitWithdraw(0)).to.be.revertedWith('Limit Withdraw Token must be greater than 0')
    })
    it('should set limit withdraw correctly', async () => {
      const tx1 = await bank.setLimitWithdraw(30000)
      await tx1.wait()
      expect(await bank.getlimitWithdraw()).to.be.equal(30000)
    })
  })
  describe('setCooldownTime', function () {
    it('should revert if new time = 0', async () => {
      await expect(bank.setCooldownTime(0)).to.be.revertedWith('Please input new cooldown time > 0')
    })
    it('should set cooldown time correctly', async () => {
      const tx1 = await bank.setCooldownTime(15)
      await tx1.wait()
      expect(await bank.getTimeCoolDown()).to.be.equal(15)
    })
  })
  describe('changeToken', function () {
    it('should revert if address is zero address', async () => {
      await expect(bank.changeToken(address0)).to.be.revertedWith('Address can not be zero address')
    })
    it('should revert if address is not contract address', async () => {
      await expect(bank.changeToken(accountB.address)).to.be.revertedWith('You must input token address')
    })
    it('should chane token correctly', async () => {
      const Token1 = await ethers.getContractFactory('HdnToken')
      const token1 = await Token1.deploy()
      await token1.deployed()

      const tx1 = await bank.changeToken(token1.address)
      await tx1.wait()
      expect(await bank.getTokenAddress()).to.be.equal(token1.address)
      const tx2 = await token1.claim(10000, accountC.address)
      await tx2.wait()
      expect(await token1.balanceOf(accountC.address)).to.be.equal(10000)
    })
  })
  describe('depositToken', function () {
    it('should revert if amount = 0', async () => {
      await expect(bank.connect(accountB).depositToken(0)).to.be.revertedWith('Please input amount greater than 0')
    })
    it('should revert if amount > balance of account B', async () => {
      await expect(bank.connect(accountB).depositToken(100001)).to.be.revertedWith(
        'Your funds do not enough to deposit'
      )
    })
    it('should deposit token correctly', async () => {
      const tx1 = await bank.connect(accountB).depositToken(40000)
      await tx1.wait()

      expect(await token.balanceOf(accountB.address)).to.be.equal(60000)
      expect(await token.balanceOf(accountD.address)).to.be.equal(40000)
      expect(await bank.getBalanceOf(accountB.address)).to.be.equal(40000)
    })
  })
  describe('transferToken', function () {
    beforeEach(async () => {
      const deposit = await bank.connect(accountB).depositToken(40000)
      await deposit.wait()
    })
    it('should revert if amount = 0', async () => {
      await expect(bank.connect(accountB).transferToken(0, accountC.address)).to.be.revertedWith(
        'Please input amount greater than 0'
      )
    })
    it('should revert if amount > balance of account B', async () => {
      await expect(bank.connect(accountB).transferToken(40001, accountC.address)).to.be.revertedWith(
        'Your fund in bank is not enough to transfer'
      )
    })
    it('should revert if time ready is not yet', async () => {
      const tx1 = await bank.connect(accountB).transferToken(10000, accountC.address)
      await tx1.wait()
      await expect(bank.connect(accountB).transferToken(10000, accountC.address)).to.be.revertedWith(
        'The next transfer is not yet'
      )
    })
    it('should revert if wallet of recieveis not enough token', async () => {
      const tx1 = await token.connect(accountD).transfer(accountC.address, 30000)
      await tx1.wait()
      await expect(bank.connect(accountB).transferToken(20000, accountC.address)).to.be.revertedWith(
        'Wallet of reciever is not enough token'
      )
    })
    it('should transfer token correctly', async () => {
      const tx1 = await bank.connect(accountB).transferToken(10000, accountC.address)
      await tx1.wait()
      expect(await bank.getBalanceOf(accountB.address)).to.be.equal(30000)
      expect(await bank.getBalanceOf(accountC.address)).to.be.equal(10000)
      expect(await token.balanceOf(accountC.address)).to.be.equal(10000)

      await network.provider.send('evm_increaseTime', [10])
      const tx2 = await bank.connect(accountB).transferToken(10000, accountC.address)
      await tx2.wait()
      expect(await bank.getBalanceOf(accountB.address)).to.be.equal(20000)
      expect(await bank.getBalanceOf(accountC.address)).to.be.equal(20000)
      expect(await token.balanceOf(accountC.address)).to.be.equal(20000)
    })
  })
  describe('withdrawToken', function () {
    beforeEach(async () => {
      const deposit = await bank.connect(accountB).depositToken(40000)
      await deposit.wait()
    })
    it('should revert if amount = 0', async () => {
      await expect(bank.connect(accountB).withdrawToken(0)).to.be.revertedWith('Please input amount greater than 0')
    })
    it('should revert if amount > balance of account B', async () => {
      const tx1 = await bank.connect(accountB).withdrawToken(15000)
      await tx1.wait()
      await network.provider.send('evm_increaseTime', [10])
      const tx2 = await bank.connect(accountB).withdrawToken(15000)
      await tx2.wait()
      await network.provider.send('evm_increaseTime', [10])
      expect(await bank.getBalanceOf(accountB.address)).to.be.equal(10000)
      await expect(bank.connect(accountB).withdrawToken(15000)).to.be.revertedWith(
        'You are not enough funds to withdraw'
      )
    })
    it('should revert exceed max amount one time', async () => {
      await expect(bank.connect(accountB).withdrawToken(20001)).to.be.revertedWith('Max amount one time')
    })
    it('should revert if time ready is not yet', async () => {
      const tx1 = await bank.connect(accountB).withdrawToken(10000)
      await tx1.wait()
      await expect(bank.connect(accountB).withdrawToken(10000)).to.be.revertedWith('The next withdrawal is not yet')
    })
    it('should revert if wallet of recieveis not enough token', async () => {
      const tx1 = await token.connect(accountD).transfer(accountC.address, 30000)
      await tx1.wait()
      await expect(bank.connect(accountB).transferToken(20000, accountC.address)).to.be.revertedWith(
        'Wallet of reciever is not enough token'
      )
    })
    it('should withdraw token correctly', async () => {
      const tx1 = await bank.connect(accountB).withdrawToken(10000)
      await tx1.wait()
      expect(await bank.getBalanceOf(accountB.address)).to.be.equal(30000)
      expect(await token.balanceOf(accountD.address)).to.be.equal(30000)

      await network.provider.send('evm_increaseTime', [10])
      const tx2 = await bank.connect(accountB).transferToken(10000, accountC.address)
      await tx2.wait()
      expect(await bank.getBalanceOf(accountB.address)).to.be.equal(20000)
      expect(await token.balanceOf(accountD.address)).to.be.equal(20000)
    })
  })
})
