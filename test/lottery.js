const { expectRevert } = require('@openzeppelin/test-helpers');
const { assertion } = require('@openzeppelin/test-helpers/src/expectRevert');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const Lottery = artifacts.require("./Lottery.sol");
const BN = require('bn.js');
const { it } = require('node:test');

import { solidityCoverage } from 'solidity-coverage';

module.exports = async () => {
  await solidityCoverage();
};

contract("Lottery", (accounts) => {
    let lottery;
    const ticketPrice = toBN(web3.utils.toWei(10e18));
    beforeEach(async () => {
        lottery = await Lottery.deployed();
    });

    it("admin address should equal deployer address", async () => {
        const adminAddress = await lottery.admin.call();
        const deployerAddress = accounts[0];
        assert.equal(adminAddress, deployerAddress, 'admin is not the deployer');
    });

    it("set ticket price", async () => {
        const price = await lottery.ticketPrice.call();
        assert(price == toBN(web3.utils.toWei(10e18)));
    });

    it("should set lottery drawing", async () => {
        const drawing = await lottery.drawing.call();
        assert(drawing);
    });
  
    it("should NOT buy ticket if you already have a ticket", async () => {
        await expectRevert(
            lottery.enterLottery({from: accounts[1], value: ticketPrice}),
            'can only buy one ticket'
        );
    });

    it("should NOT buy ticket if account balance too low", async () => {
        await expectRevert(
            lottery.enterLottery({from: accounts[1], value: 0}),
            'balance too low'
        );
    });

    it("should NOT buy ticket if if not paying the exact amount", async () => {
        await expectRevert(
            lottery.enterLottery({from: accounts[1], value: toBN(web3.utils.toWei(11e18))}),
            'have to pay the exact amount for the ticket'
        );
    });

    it("should enter lottery", async () => {
        const player1 = accounts[1];
        await lottery.enterLottery({from: player1, value: ticketPrice});
        const entrant = await lottery.entrants.call("0");
        assert.equal(entrant, player1, 'new player is not in the lottery');
    });

    it("lottery should have balance", async () => {
        const LotteryBalance = web3.utils.toBN(await web3.eth.getBalance(lottery.address));
        assert.ok(LotteryBalance == ticketPrice);
    });

    it("only admin can decide the winner", async () => {
        await expectRevert(
            lottery.decideWinner({from: accounts[1]}),
            'only admin can decide the winner'
        );
    });

    it("should decide winner and reset entrants array", async () => {
        const LotteryBalance = web3.utils.toBN(await web3.eth.getBalance(lottery.address));
        await lottery.decideWinner({from: accounts[0]});
        assert.equal(LotteryBalance, '0');

        const entrantList = await lottery.entrants.call({from: accounts[0]});
        assert.strictEqual(0, entrantList.length);
    }); 
});

