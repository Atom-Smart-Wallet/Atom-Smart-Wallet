import { ethers } from 'ethers';
import { sha256 } from 'js-sha256';

// Device fingerprint için kullanılacak özellikleri toplayan fonksiyon
const getDeviceFingerprint = async (): Promise<string> => {
  try {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.pixelDepth,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency,
      navigator.platform
    ];

    // Canvas parmak izi
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        components.push(
          gl.getParameter(gl.VENDOR),
          gl.getParameter(gl.RENDERER),
          gl.getParameter(gl.VERSION)
        );
      }
    } catch (e) {
      console.warn('WebGL fingerprint alınamadı:', e);
    }
    
    // Tüm bileşenleri birleştir ve hash'le
    const fingerprint = components.join('|');
    return sha256(fingerprint);
  } catch (error) {
    console.error('Fingerprint oluşturma hatası:', error);
    // Fallback olarak timestamp ve random değer kullan
    const fallback = Date.now().toString() + Math.random().toString();
    return sha256(fallback);
  }
};

// Local wallet'ı yöneten sınıf
export class LocalWallet {
  private static instance: LocalWallet;
  private wallet: ethers.Wallet | null = null;
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    // Constructor'da provider başlatma işlemini yapma
  }

  public static getInstance(): LocalWallet {
    if (!LocalWallet.instance) {
      LocalWallet.instance = new LocalWallet();
    }
    return LocalWallet.instance;
  }

  private async initializeProvider() {
    if (!this.provider && !this.isInitializing) {
      this.isInitializing = true;
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
        if (!rpcUrl) {
          throw new Error('RPC URL bulunamadı');
        }

        this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        
        // Provider'ın hazır olduğundan emin ol
        await this.provider.ready;
        
        // Network bağlantısını test et
        await this.provider.getNetwork();
      } catch (error) {
        console.error('Provider başlatma hatası:', error);
        this.provider = null;
        throw new Error('Ağ bağlantısı kurulamadı');
      } finally {
        this.isInitializing = false;
      }
    }
  }

  // Device fingerprint'ten private key oluştur
  private async generatePrivateKey(): Promise<string> {
    const fingerprint = await getDeviceFingerprint();
    return ethers.utils.hexZeroPad(ethers.utils.hexlify('0x' + fingerprint), 32);
  }

  // Wallet'ı başlat veya var olanı getir
  public async getWallet(): Promise<ethers.Wallet> {
    if (!this.wallet) {
      if (!this.initPromise) {
        this.initPromise = this.initializeProvider();
      }
      await this.initPromise;

      if (!this.provider) {
        throw new Error('Provider başlatılamadı');
      }

      const privateKey = await this.generatePrivateKey();
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Wallet'ın geçerli olduğunu kontrol et
      try {
        await this.wallet.getAddress();
      } catch (error) {
        this.wallet = null;
        throw new Error('Wallet oluşturulamadı');
      }
    }
    return this.wallet;
  }

  // Signer'ı getir
  public async getSigner(): Promise<ethers.Signer> {
    const wallet = await this.getWallet();
    if (!this.provider) {
      throw new Error('Provider başlatılamadı');
    }
    return wallet.connect(this.provider);
  }

  // Wallet adresini getir
  public async getAddress(): Promise<string> {
    const wallet = await this.getWallet();
    return wallet.address;
  }

  // Provider'ı resetle
  public reset(): void {
    this.wallet = null;
    this.provider = null;
    this.initPromise = null;
    this.isInitializing = false;
  }

  // Provider'ı getir
  public async getProvider(): Promise<ethers.providers.JsonRpcProvider> {
    if (!this.initPromise) {
      this.initPromise = this.initializeProvider();
    }
    await this.initPromise;

    if (!this.provider) {
      throw new Error('Provider başlatılamadı');
    }

    return this.provider;
  }
} 