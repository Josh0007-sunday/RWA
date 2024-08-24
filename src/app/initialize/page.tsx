"use client";

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { web3 } from "@project-serum/anchor";
import {
    PublicKey,
    SystemProgram,
    ComputeBudgetProgram,
    Transaction,
    Keypair,
    AccountInfo,
} from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    MINT_SIZE,
} from "@solana/spl-token";
import { getProvider, getProgram } from "../web3/connection";

const { SYSVAR_RENT_PUBKEY } = web3;
const anchor = require("@project-serum/anchor");

const TOKEN22_PROGRAM_ID = new anchor.web3.PublicKey(
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

const MINIMUM_BALANCE_FOR_TRANSACTION = 0.001 * web3.LAMPORTS_PER_SOL;

const InitializeRwa = () => {
    const { publicKey, signTransaction } = useWallet();
    const [uri, setUri] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [totalSupply, setTotalSupply] = useState<number>(0);
    const [pricePerFraction, setPricePerFraction] = useState<number>(0);
    const [mintPublicKey, setMintPublicKey] = useState<PublicKey | null>(null);
    const [rwaMetadataPublicKey, setRwaMetadataPublicKey] = useState<PublicKey | null>(null);

    const handleInitializeRwa = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!publicKey || !signTransaction) {
            console.error("Wallet not connected or doesn't support signing");
            alert("Please connect a wallet that supports transaction signing");
            return;
        }

        if (uri.length > 200) {
            alert("URI is too long. Maximum length is 200 characters.");
            return;
        }

        if (name.length > 50) {
            alert("Name is too long. Maximum length is 50 characters.");
            return;
        }

        const provider = getProvider();
        if (!provider) {
            alert("Provider is not available");
            return;
        }

        const program = getProgram();
        if (!program) {
            alert("Program is not available");
            return;
        }

        try {
            await initializeRwaAsync(publicKey, signTransaction, provider, program);
            alert("RWA Metadata initialized successfully");
        } catch (err) {
            alert(`Error initializing RWA metadata: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
    };

    const initializeRwaAsync = async (
        publicKey: PublicKey,
        signTransaction: <T extends Transaction | web3.VersionedTransaction>(transaction: T) => Promise<T>,
        provider: any,
        program: any
    ) => {
        const balance = await provider.connection.getBalance(publicKey);
        if (balance < MINIMUM_BALANCE_FOR_TRANSACTION) {
            throw new Error("Insufficient SOL balance to cover transaction fees");
        }

        if (!mintPublicKey) {
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

            try {
                const createMintTransaction = new Transaction().add(createMintAccountIx, initializeMintIx);
                createMintTransaction.feePayer = publicKey;

                const { blockhash } = await provider.connection.getLatestBlockhash();
                createMintTransaction.recentBlockhash = blockhash;

                createMintTransaction.partialSign(mintKeypair);

                const signedTransaction = await signTransaction(createMintTransaction);

                const signature = await provider.connection.sendRawTransaction(signedTransaction.serialize());
                await provider.connection.confirmTransaction(signature, 'confirmed');

                console.log("Transaction confirmed with signature:", signature);

                setMintPublicKey(mintKeypair.publicKey);
            } catch (error) {
                const err = error as Error;
                throw new Error(`Transaction failed: ${err.message}`);
            }
        }

        let rwaMetadataKeypair: Keypair;
        let accountInfo: AccountInfo<Buffer> | null;
        let retryCount = 0;
        const maxRetries = 10;

        do {
            rwaMetadataKeypair = Keypair.generate();
            accountInfo = await provider.connection.getAccountInfo(rwaMetadataKeypair.publicKey);
            retryCount++;
        } while (accountInfo !== null && retryCount < maxRetries);

        if (retryCount >= maxRetries) {
            throw new Error("Max retries reached. Unable to generate a unique account.");
        }

        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 1000000 });
        const rwaMetadataSize = program.account.rwaMetadata.size;
        const rwaMetadataLamports = await provider.connection.getMinimumBalanceForRentExemption(rwaMetadataSize);

        const createMetadataAccountIx = SystemProgram.createAccount({
            fromPubkey: publicKey,
            newAccountPubkey: rwaMetadataKeypair.publicKey,
            space: rwaMetadataSize,
            lamports: rwaMetadataLamports,
            programId: program.programId,
        });

        const initializeIx = await program.methods.initializeRwa(
            uri,
            name,
            new anchor.BN(totalSupply),
            new anchor.BN(pricePerFraction)
        ).accounts({
            rwaMetadata: rwaMetadataKeypair.publicKey,
            creator: publicKey,
            mint: mintPublicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN22_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
        }).instruction();

        const combinedTransaction = new Transaction()
            .add(modifyComputeUnits)
            .add(createMetadataAccountIx)
            .add(initializeIx);

        combinedTransaction.feePayer = publicKey;
        const { blockhash } = await provider.connection.getLatestBlockhash();
        combinedTransaction.recentBlockhash = blockhash;

        combinedTransaction.partialSign(rwaMetadataKeypair);

        const signedTransaction = await signTransaction(combinedTransaction);

        const signature = await provider.connection.sendRawTransaction(signedTransaction.serialize());
        await provider.connection.confirmTransaction(signature, 'confirmed');

        setRwaMetadataPublicKey(rwaMetadataKeypair.publicKey);
    };

    return (
        <div>
            <h1>Initialize RWA</h1>
            <form onSubmit={handleInitializeRwa}>
                <input
                    className="text-black"
                    type="text"
                    placeholder="URI"
                    value={uri}
                    onChange={(e) => setUri(e.target.value)}
                    maxLength={200}
                    required
                />
                <input
                    className="text-black"
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    required
                />
                <input
                    className="text-black"
                    type="number"
                    placeholder="Total Supply"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(Number(e.target.value))}
                    required
                />
                <input
                    className="text-black"
                    type="number"
                    placeholder="Price per Fraction"
                    value={pricePerFraction}
                    onChange={(e) => setPricePerFraction(Number(e.target.value))}
                    required
                />
                <button type="submit">Initialize RWA</button>
            </form>
            {mintPublicKey && <p>Mint Public Key: {mintPublicKey.toBase58()}</p>}
            {rwaMetadataPublicKey && <p>RWA Metadata Public Key: {rwaMetadataPublicKey.toBase58()}</p>}
        </div>
    );
};

export default InitializeRwa;