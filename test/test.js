const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('HDN token', function () {
  let [accountA, accountB, accountC] = []
  let token
  let totalSupply = 400000
  let initialSupply = 200000

  before(async () => {
    ;[accountA, accountB, accountC] = await ethers.getSigners()
    const Token = await ethers.getContractFactory('HDNToken')
    token = await Token.deploy()
    await token.deployed()
  })

  describe('common', function () {
    it("Name should be 'HDN Token'", async () => {
      const name = await token.name()
      expect(name).to.be.a.string
      expect(name).to.equal('HDN Token')
    })

    it('Should have 18 decimals', async () => {
      expect(await token.decimals()).to.be.equal(18)
    })

    it('Total supply should return right value', async function () {
      expect(await token.getTotalSupply()).to.be.equal(totalSupply)
    })
    it('Balance of account A should return right value', async function () {
      expect(await token.getBelanceOf(accountA.address)).to.be.equal(initialSupply)
    })
    it('Balance of account B should return right value', async function () {
      expect(await token.getBelanceOf(accountB.address)).to.be.equal(0)
    })
  })

  describe('claim', function () {
    it('claim should revert if amount exceeds 100000', async function () {
      await expect(token.connect(accountB).claim(100001)).to.be.revertedWith('Max amount one time')
    })
    it('claim should work correctly', async function () {
      const tx = await token.connect(accountB).claim(100000)
      await tx.wait()
      expect(await token.getBelanceOf(accountB.address)).to.be.equal(100000)
      await token.connect(accountC).claim(100000)
      expect(await token.getBelanceOf(accountC.address)).to.be.equal(100000)
      expect(await token.getTotalClaim()).to.be.equal(200000)
      console.log(await token.getTotalClaim())
    })
    it('claim should revert if total claim + amount > total supply -initial supply ', async function () {
      console.log(await token.getTotalClaim())
      await expect(token.connect(accountC).claim(50000)).to.be.revertedWith('Not enough token to claim')
    })
  })

  describe('resetTotalSupply', function () {
    it('resetTotalSupply should be revert if amount < total claim + initial supply', async function () {
      await expect(token.resetTotalSupply(300000)).to.be.revertedWith('Total supply is too low')
    })
    it('resetTotalSupply should work correctly', async function () {
      await token.resetTotalSupply(600000)
      expect(await token.getTotalSupply()).to.be.equal(600000)
    })
  })
})
