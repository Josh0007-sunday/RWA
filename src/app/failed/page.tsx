"use client";

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

const InitializeRwa: React.FC = () => {
    const { publicKey } = useWallet();
    const [uri, setUri] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [totalSupply, setTotalSupply] = useState<number>(0);
    const [pricePerFraction, setPricePerFraction] = useState<number>(0);
    const [mintPublicKey, setMintPublicKey] = useState<string | null>(null);

    const handleInitializeRwa = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("/web3/initializeraw", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    publicKey: publicKey?.toBase58(),
                    uri,
                    name,
                    totalSupply,
                    pricePerFraction,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setMintPublicKey(result.mintPublicKey);
                alert("RWA initialized successfully!");
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            alert("Initialization failed");
        }
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
            {mintPublicKey && <p>Mint Public Key: {mintPublicKey}</p>}
        </div>
    );
};

export default InitializeRwa;
