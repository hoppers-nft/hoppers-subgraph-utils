import { Address, BigInt, log, store} from "@graphprotocol/graph-ts"
import { FLY, Approval, OwnerUpdated, Transfer } from "../generated/FLY/FLY"
import {
  BurnedStat, BurnedByBreeding, FlyStaker
} from "../generated/schema"


export function handleTransfer(event: Transfer): void {
  if (event.params.to.equals(Address.zero())) {
    if (event.transaction.to!.equals(Address.fromHexString('0x16d5791f7c31d7e13dd7b18ae2011764c4da8fbc')) ||
      event.transaction.to!.equals(Address.fromHexString('0x711233d6AAd35b14750F65f9CF413fa748149345'))) {
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
  else if (event.transaction.to!.equals(Address.fromHexString('0xbaF9a6F8A8AFd4BE0d85Ca40f025Bf364fA27324'))) {
    if(event.params.amount.equals(BigInt.zero())){
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


  }
  else if (event.params.from.equals(Address.fromHexString('0xbaF9a6F8A8AFd4BE0d85Ca40f025Bf364fA27324'))) {
    let staker = FlyStaker.load(event.transaction.from.toHex())
    if (staker!.staked.equals(event.params.amount)) {
      store.remove('FlyStaker', event.transaction.from.toHex())
    }
    else {
      staker!.staked = staker!.staked.minus(event.params.amount);
      staker!.save();
    }
  }
}


