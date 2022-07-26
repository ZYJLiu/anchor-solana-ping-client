import * as anchor from "@project-serum/anchor"
import idl from "./idl.json"

async function main() {
  // generate keypair for payer
  const payer = anchor.web3.Keypair.generate()

  // create connection to devnet
  const connection = new anchor.web3.Connection(
    anchor.web3.clusterApiUrl("devnet")
  )

  // call airdrop helper function to fund payer keypair
  await airdrop(connection, payer)

  // create Wallet object from payer keypair
  const wallet = new anchor.Wallet(payer)

  // create provider from connection and wallet
  const provider = new anchor.AnchorProvider(connection, wallet, {})
  anchor.setProvider(provider)

  // convert programId to Publickey object
  const programId = new anchor.web3.PublicKey(
    "3ycJzxn4Akd2A3G2EDAW5RrM5V5DeRWt84MWHJ1ctLUr"
  )

  // create program from IDL and programId
  const program = new anchor.Program(idl as anchor.Idl, programId)

  // generate keypair for counter account
  const counter = anchor.web3.Keypair.generate()

  // call createCounter helper function
  await createCounter(wallet, counter, program)

  // call incrementCounter helper function
  await incrementCounter(wallet, counter, program)

  // call incrementCounter helper function again
  await incrementCounter(wallet, counter, program)
}

async function airdrop(
  connection: anchor.web3.Connection,
  payer: anchor.web3.Keypair
) {
  // call requestAirdrop
  const transactionSignature = await connection.requestAirdrop(
    payer.publicKey,
    anchor.web3.LAMPORTS_PER_SOL * 1
  )

  // confirm requestAirdrop transaction
  await connection.confirmTransaction(transactionSignature)

  // check balance
  const balance =
    (await connection.getBalance(payer.publicKey)) /
    anchor.web3.LAMPORTS_PER_SOL
  console.log("SOL Balance After Airdrop", balance)
}

async function createCounter(
  wallet: anchor.Wallet,
  counter: anchor.web3.Keypair,
  program: anchor.Program
) {
  // invoke "create" instruction from program
  const transactionSignature = await program.methods
    .create()
    .accounts({
      counter: counter.publicKey,
      user: wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([counter])
    .rpc()

  console.log(
    `Create Counter Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

async function incrementCounter(
  wallet: anchor.Wallet,
  counter: anchor.web3.Keypair,
  program: anchor.Program
) {
  // invoke "increment" instruction from program
  const transactionSignature = await program.methods
    .increment()
    .accounts({
      counter: counter.publicKey,
      user: wallet.publicKey,
    })
    .signers([])
    .rpc()

  console.log(
    `Increment Counter Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

main()
  .then(() => {
    console.log("Finished successfully")
  })
  .catch((error) => {
    console.error(error)
  })
