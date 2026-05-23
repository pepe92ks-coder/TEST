<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phantom Custom Display</title>
    <script src="https://cdn.jsdelivr.net/npm/@solana/web3.js@1.87.6/lib/index.iife.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #0a0c12;
            font-family: 'Segoe UI', system-ui;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .card {
            background: #1a1f2e;
            border-radius: 24px;
            padding: 32px;
            width: 400px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .balance {
            font-size: 48px;
            font-weight: bold;
            color: #8247e5;
            margin: 20px 0;
        }
        .token-list {
            margin: 20px 0;
            text-align: left;
        }
        .token {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #2a2f3e;
        }
        button {
            background: linear-gradient(135deg, #8247e5, #6a1b9a);
            border: none;
            padding: 12px 24px;
            border-radius: 30px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            font-size: 16px;
        }
        .warning {
            background: rgba(239, 68, 68, 0.1);
            color: #f87171;
            padding: 10px;
            border-radius: 12px;
            font-size: 12px;
            margin-top: 20px;
        }
        .connected {
            background: #0f1119;
            padding: 12px;
            border-radius: 12px;
            font-size: 12px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
<div class="card">
    <h2>✨ Phantom Custom Display</h2>
    <p style="color: #8a92a3; margin: 10px 0;">Conecta tu wallet real • Datos demostrativos</p>
    
    <div class="connected" id="walletStatus">
        ⚡ No conectado
    </div>
    
    <div class="balance" id="displayBalance">
        $0.00
    </div>
    
    <div class="token-list" id="tokenList">
        <div class="token"><span>🪙 SOL</span><span id="solBalance">0.00</span></div>
        <div class="token"><span>💵 USDC</span><span id="usdcBalance">0.00</span></div>
        <div class="token"><span>🐕 BONK</span><span id="bonkBalance">0</span></div>
    </div>
    
    <button id="connectBtn">🔌 Conectar Phantom</button>
    
    <div class="warning">
        ⚠️ Los balances mostrados son DEMOSTRATIVOS.<br>
        No representan tus fondos reales en la blockchain.
    </div>
</div>

<script>
    // DATOS FALSOS - PUEDES EDITARLOS
    const FAKE_DATA = {
        sol: 12500.50,
        usdc: 50000.00,
        bonk: 125000000,
        solPrice: 200  // Precio ficticio de SOL
    };
    
    let provider = null;
    let connected = false;
    
    function updateDisplay() {
        const totalValue = (FAKE_DATA.sol * FAKE_DATA.solPrice) + FAKE_DATA.usdc;
        document.getElementById('displayBalance').innerText = `$${totalValue.toLocaleString()}`;
        document.getElementById('solBalance').innerText = `${FAKE_DATA.sol.toLocaleString()} SOL`;
        document.getElementById('usdcBalance').innerText = `${FAKE_DATA.usdc.toLocaleString()} USDC`;
        document.getElementById('bonkBalance').innerText = FAKE_DATA.bonk.toLocaleString();
    }
    
    async function connectPhantom() {
        if ('phantom' in window) {
            provider = window.phantom?.solana;
            
            if (provider?.isPhantom) {
                try {
                    const response = await provider.connect();
                    const publicKey = response.publicKey.toString();
                    
                    connected = true;
                    document.getElementById('walletStatus').innerHTML = 
                        `✅ Conectado: ${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 4)}`;
                    document.getElementById('connectBtn').innerText = '✅ Wallet Conectada';
                    document.getElementById('connectBtn').disabled = true;
                    
                    // Mostrar datos falsos
                    updateDisplay();
                    
                    console.log('📍 Wallet real conectada:', publicKey);
                    console.log('⚠️ Los balances mostrados son DEMOSTRATIVOS');
                    
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al conectar');
                }
            } else {
                alert('Phantom no está instalado');
                window.open('https://phantom.app/', '_blank');
            }
        } else {
            alert('Phantom no está instalado');
            window.open('https://phantom.app/', '_blank');
        }
    }
    
    document.getElementById('connectBtn').addEventListener('click', connectPhantom);
    
    // Inicializar con datos de ejemplo
    updateDisplay();
</script>
</body>
</html>
