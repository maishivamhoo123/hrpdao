import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

function WalletConnect() {
  const { t } = useTranslation();
  const [connected, setConnected] = useState(false);

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      alert(t('metaMaskNotFound'));
      return;
    }
    try {
      if (!window.ethereum.isMetaMask || !window.ethereum.isConnected()) {
        alert(t('metaMaskNotReady'));
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setConnected(true);
        alert(t('walletConnected'));
      }
    } catch (error) {
      console.error('Помилка підключення до MetaMask:', error);
      alert(t('walletConnectionError'));
    }
  };

  return (
    <button
      onClick={handleConnectWallet}
      className="inline-flex justify-center rounded-md border border-transparent bg-yellow-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500"
      disabled={connected}
    >
      {connected ? t('walletConnected') : t('connectWallet')}
    </button>
  );
}

export default WalletConnect;