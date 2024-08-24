import type { NextApiRequest, NextApiResponse } from 'next';
import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getProvider, getProgram } from './connection';
import { TOKEN_PROGRAM_ID, MINT_SIZE, createInitializeMintInstruction } from '@solana/spl-token';
import { web3 } from '@project-serum/anchor';

const { SYSVAR_RENT_PUBKEY } = web3;
const anchor = require("@project-serum/anchor");

const TOKEN22_PROGRAM_ID = new anchor.web3.PublicKey(
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { publicKey, uri, name, totalSupply, pricePerFraction } = req.body;

    const provider = getProvider();
    if (!provider) {
        return res.status(500).json({ error: 'Provider not available' });
    }

    const program = getProgram();
    if (!program) {
        return res.status(500).json({ error: 'Program not available' });
    }

    try {
        const mintKeypair = Keypair.generate();
        const lamports = await provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

        const createMintAccountIx = SystemProgram.createAccount({
            fromPubkey: publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN22_PROGRAM_ID,
        });

        const initializeMintIx = createInitializeMintInstruction(
            mintKeypair.publicKey,
            0,
            publicKey,
            publicKey
        );

        const createMintTransaction = new Transaction().add(createMintAccountIx, initializeMintIx);
        createMintTransaction.feePayer = publicKey;
        const { blockhash } = await provider.connection.getLatestBlockhash();
        createMintTransaction.recentBlockhash = blockhash;
        createMintTransaction.partialSign(mintKeypair);

        const signature = await sendAndConfirmTransaction(
            provider.connection,
            createMintTransaction,
            [mintKeypair],
            { commitment: 'confirmed' }
        );

        return res.status(200).json({ signature, mintPublicKey: mintKeypair.publicKey.toBase58() });
    } catch (error) {
       return res.status(500).json({ error: "An unknown error occurred." });
    }
}
