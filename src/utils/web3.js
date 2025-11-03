import { ethers } from 'ethers';

     export async function connectWallet() {
       if (typeof window.ethereum === 'undefined') {
         throw new Error('MetaMask is not installed');
       }
       try {
         const provider = new ethers.BrowserProvider(window.ethereum);
         await provider.send('eth_requestAccounts', []);
         const signer = await provider.getSigner();
         return signer;
       } catch (error) {
         console.error('Failed to connect wallet:', error);
         throw error;
       }
     }
