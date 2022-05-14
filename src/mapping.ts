import { Address, BigInt, log, store } from "@graphprotocol/graph-ts"
import { Transfer } from "../generated/FLY/FLY"
import {
  BurnedStat, BurnedByBreeding, FlyStaker, VeFly
} from "../generated/schema"

const generationRateDenominator: BigInt = BigInt.fromI32(100);
const generationRateNumerator: BigInt = BigInt.fromI32(3600000);
const maxRatio: BigInt = BigInt.fromI32(14);
const BREEDING_ADDRESS_OLD = Address.fromHexString('0x16d5791f7c31d7e13dd7b18ae2011764c4da8fbc')
const BREEDING_ADDRESS_NEW = Address.fromHexString('0x711233d6AAd35b14750F65f9CF413fa748149345')
const VEFLY_ADDRESS = Address.fromHexString('0xbaF9a6F8A8AFd4BE0d85Ca40f025Bf364fA27324');



const genMAx: BigInt = BigInt.fromI32(123);

export function handleTransfer(event: Transfer): void {
  if (event.params.to.equals(Address.zero())) {
    if (event.transaction.to!.equals(BREEDING_ADDRESS_OLD) || event.transaction.to!.equals(BREEDING_ADDRESS_NEW)) {
      let breeding = BurnedByBreeding.load('burnedByBreeding')
      if (!breeding) {
        breeding = new BurnedByBreeding('burnedByBreeding');
        breeding.burned = event.params.amount;
      }
      else {
        breeding.burned = event.params.amount.plus(breeding.burned);
      }
      breeding.save();
    }
    let burnedStats = BurnedStat.load('burnedStats')
    if (!burnedStats) {
      burnedStats = new BurnedStat('burnedStats');
      burnedStats.burned = event.params.amount;
    }
    else {
      burnedStats.burned = event.params.amount.plus(burnedStats.burned);
    }
    burnedStats.save();

  }

  // handle staking 
  else if (event.transaction.to!.equals(VEFLY_ADDRESS)) {
    if (event.params.amount.equals(BigInt.zero())) {
      return; // staked zero, this happens
    }
    let staker = FlyStaker.load(event.transaction.from.toHex());
    if (!staker) {
      staker = new FlyStaker(event.transaction.from.toHex());
      staker.staked = event.params.amount;
    }
    else {
      staker.staked = event.params.amount.plus(staker.staked);
    }
    staker.save();
    handleDepositToVeFly(event);
  }
  else if (event.params.from.equals(VEFLY_ADDRESS)) {
    if (event.params.amount.equals(BigInt.zero())) {
      log.error("{}",['Unstaked zero! This might be the error!'])
      return; // staked zero, this happens
    }
    let staker = FlyStaker.load(event.transaction.from.toHex())
    if (staker) {
      staker.staked = staker.staked.minus(event.params.amount);
      staker.save();
      if (staker.staked.equals(BigInt.zero())) {
        store.remove('FlyStaker', event.transaction.from.toHex())
      }
    }
    else {
      log.error("{} -> {}", ['a staker that doesnt exist has withdrawn from the contract!', event.transaction.from.toHex()])
    }
    handleWithdrawFromVeFly(event);
  }

}

function calculateVeFLYBalance(event: Transfer): BigInt {
  let user = VeFly.load(event.transaction.from.toHex());
  if (user) {
    const timeDiff = event.block.timestamp.minus(BigInt.fromI32(user.snapshot));
    const result = user.veFlyBalance.plus(((user.flyBalance.times(generationRateNumerator)).times(timeDiff)).div(generationRateDenominator))
    const maxVe = maxRatio.times(user.flyBalance);
    if (result.gt(maxRatio)) {
      return maxVe;
    }
    else {
      return result;
    }
  }
  else {
    return BigInt.zero();
  }

}

function handleDepositToVeFly(event: Transfer): void {
  let user = VeFly.load(event.transaction.from.toHex())
  if (!user) {
    user = new VeFly(event.transaction.from.toHex())
    user.flyBalance = BigInt.zero();
  }
  user.veFlyBalance = calculateVeFLYBalance(event); // returns 0 if not saved yet
  user.flyBalance = event.params.amount.plus(user.flyBalance);
  user.snapshot = event.block.timestamp.toI32();
  user.save();
}

function handleWithdrawFromVeFly(event: Transfer): void {
  store.remove('VeFly', event.transaction.from.toHex())
}


