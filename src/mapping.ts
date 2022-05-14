import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import { FLY, Approval, OwnerUpdated, Transfer } from "../generated/FLY/FLY"
import { BurnedStats } from "../generated/schema"





export function handleTransfer(event: Transfer): void {
  if(event.params.to.equals(Address.zero())){
  log.error("{}",['Burned'])
  }
  else if(event.params.from.equals(Address.zero())){
    log.error("{}",['Minted'])

  }
  else {
    return
  }
  log.error("Tx to: supposed to be adv address{}",[event.transaction.to!.toHex()])
  log.error("Tx from: supposed to be user addy{}",[event.transaction.from.toHex()])
  log.error("Amount : {}",[event.params.amount.toString()])

  //event.transaction.to
  
  //let entity = BurnedStats.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  //if (!entity) {
    //entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
   // entity.count = BigInt.fromI32(0)
  //}
}
