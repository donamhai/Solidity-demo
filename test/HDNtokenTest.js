const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('HDN token', async () => {
  let [accountA, accountB, accountC] = []
  let token
  let totalSupply = 400000
  let initialSupply = 200000

  beforeEach(async () => {
    ;[accountA, accountB, accountC] = await ethers.getSigners()
    const Token = await ethers.getContractFactory('HdnToken')
    token = await Token.deploy()
    await token.deployed()
  })

  describe('common', async () => {
    it("Name should be 'HDN Token'", async () => {
      const name = await token.name()
      expect(name).to.be.a.string
      expect(name).to.equal('HDN Token')
    })

    it('Should have 18 decimals', async () => {
      expect(await token.decimals()).to.be.equal(18)
    })

    it('Total supply should return right value', async () => {
      expect(await token.getTotalSupply()).to.be.equal(totalSupply)
    })
    it('Balance of account A should return right value', async () => {
      expect(await token.getBelanceOf(accountA.address)).to.be.equal(initialSupply)
    })
    it('Balance of account B and C should return right value', async () => {
      expect(await token.getBelanceOf(accountB.address)).to.be.equal(0)
      expect(await token.getBelanceOf(accountC.address)).to.be.equal(0)
    })
  })

  describe('claim', async () => {
    it('Claim should revert if not admin', async () => {
      await expect(token.connect(accountB).claim(100000, accountB.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('Claim should revert if amount exceeds 100000', async () => {
      await expect(token.claim(100001, accountB.address)).to.be.revertedWith('Max amount one time')
    })
    it('claim should work correctly', async () => {
      const tx1 = await token.claim(100000, accountB.address)
      await tx1.wait()
      expect(await token.getBelanceOf(accountB.address)).to.be.equal(100000)
      const tx2 = await token.claim(100000, accountC.address)
      await tx2.wait()
      expect(await token.getBelanceOf(accountC.address)).to.be.equal(100000)
      expect(await token.getTotalClaim()).to.be.equal(200000)
    })
    it('claim should revert if total claim + amount > total supply -initial supply ', async () => {
      const tx1 = await token.claim(100000, accountB.address)
      await tx1.wait()
      const tx2 = await token.claim(100000, accountC.address)
      await tx2.wait()
      await expect(token.claim(50000, accountC.address)).to.be.revertedWith('Not enough token to claim')
    })
  })

  describe('resetTotalSupply', async () => {
    it('resetTotalSupply should be revert if amount < total claim + initial supply', async () => {
      const tx1 = await token.claim(100000, accountB.address)
      await tx1.wait()
      const tx2 = await token.claim(100000, accountC.address)
      await tx2.wait()
      await expect(token.resetTotalSupply(300000)).to.be.revertedWith('Total supply is too low')
    })
    it('should revert if not role admin', async () => {
      await expect(token.connect(accountB).resetTotalSupply(600000)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('resetTotalSupply should work correctly', async () => {
      const tx = await token.resetTotalSupply(600000)
      await tx.wait()
      expect(await token.getTotalSupply()).to.be.equal(600000)
    })
  })

  describe('pause', async () => {
    it('should revert if not pause role', async () => {
      await expect(token.connect(accountB).pause()).to.be.reverted
    })
    it('should revert if contract has been pause', async () => {
      const tx = await token.pause()
      await tx.wait()
      await expect(token.pause()).to.be.revertedWith('Pausable: paused')
    })
    it('should pause contract correctly', async () => {
      const tx = await token.pause()
      await tx.wait()
      await expect(token.claim(50000, accountB.address)).to.be.revertedWith('Pausable: paused')
    })
  })

  describe('unpause', async () => {
    beforeEach(async () => {
      const tx = await token.pause()
      await tx.wait()
    })
    it('should revert if not pause role', async () => {
      await expect(token.connect(accountB).unpause()).to.be.reverted
    })
    it('should revert if contract has been unpause', async () => {
      const tx1 = await token.unpause()
      await tx1.wait()
      await expect(token.unpause()).to.be.revertedWith('Pausable: not paused')
    })
    it('should unpause contract correctly', async () => {
      const unpauseTx = await token.unpause()
      await unpauseTx.wait()
      await expect(unpauseTx).to.be.emit(token, 'Unpaused').withArgs(accountA.address)
      const tx2 = await token.claim(50000, accountC.address)
      await tx2.wait()
      expect(await token.getBelanceOf(accountC.address)).to.be.equal(50000)
    })
  })

  describe('addToBlackList', async () => {
    it('should revert in case add sender to backlist', async () => {
      await expect(token.addToBlackList(accountA.address)).ordered.be.revertedWith('Must not add sender to blacklist')
    })
    it('should revert if account has been added to backlist', async () => {
      const tx = await token.addToBlackList(accountB.address)
      await tx.wait()
      await expect(token.addToBlackList(accountB.address)).to.be.revertedWith('Accout was on blacklist')
    })
    it('should revert if not admin role', async () => {
      await expect(token.connect(accountB).addToBlackList(accountC.address)).to.be.reverted
    })
    it('should add to blacklist correctly', async () => {
      const tx = await token.addToBlackList(accountB.address)
      await tx.wait()
      await expect(token.claim(50000, accountB.address)).to.be.revertedWith('Accout was on blacklist')
    })
  })

  describe('removeFromBlackList', async () => {
    beforeEach(async () => {
      const tx = await token.addToBlackList(accountB.address)
      await tx.wait()
    })
    it('should revert if account has not been added to backlist', async () => {
      const tx1 = await token.removeFromBlackList(accountB.address)
      await tx1.wait()
      await expect(token.removeFromBlackList(accountB.address)).to.be.revertedWith('Accout was not on blacklist')
    })
    it('should revert if not admin role', async () => {
      await expect(token.connect(accountC).removeFromBlackList(accountB.address)).to.be.reverted
    })
    it('should remove from blacklist correctly', async () => {
      const tx2 = await token.removeFromBlackList(accountB.address)
      await tx2.wait()
      const tx3 = await token.claim(50000, accountB.address)
      await tx3.wait()
      expect(await token.getBelanceOf(accountB.address)).to.be.equal(50000)
    })
  })
})
