const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('HDN token', function () {
  let [accountA, accountB, accountC] = []
  let token
  let amount = 100
  let totalSupply = 400000
  let initialSupply = 200000

  beforeEach(async () => {
    ;[accountA, accountB, accountC] = await ethers.getSigners()
    const Token = await ethers.getContractFactory('HDNToken')
    token = await Token.deploy()
    await token.deployed()
  })

  describe('common', function () {
    it('Total supply should return right value', async function () {
      expect(await token.getTotalSupply()).to.be.equal(totalSupply)
    })
    it('Balance of account A should return right value', async function () {
      expect(await token.getBelanceOf(accountA.address)).to.be.equal(initialSupply)
    })
    it('Balance of account B should return right value', async function () {
      expect(await token.getBelanceOf(accountB.address)).to.be.equal(0)
    })
    it('allowance of account A should return right value', async function () {
      expect(await token.allowace(accountA.address, accountB.address)).to.be.equal(0)
    })
  })

  describe('claim', function () {
    it('claim should revert if amount exceeds 1000000', async function () {
      expect(await token.connect(accountB).claim(1000001)).to.be.reverted
    })
    it('claim should work correctly', async function () {
      expect(await token.connect(accountB).claim(1000000).to.be.equal(1000000))
    })
    it('claim should revert if total claim + amount > total supply -initial supply ', async function () {
      await token.connect(accountB).claim(50000)
      expect(await token.connect(accountC).claim(100000)).to.be.reverted
    })
  })

  describe('resetTotalSupply', function () {
    it('resetTotalSupply should be revert if amount < total claim + initial supply', async function () {})
    it('resetTotalSupply should work correctly', async function () {})
  })
})
