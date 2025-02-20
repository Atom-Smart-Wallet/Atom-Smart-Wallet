import { DynamicTool } from '@langchain/core/tools';
import { ethers } from 'ethers';
import { sendSingleTransaction, sendBatchTransactions } from '../services/wallet';
import { getSmartAccountRegistry, sendEthToAAWallet } from '../services/contracts';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export class TransactionAgent {
  private signer: ethers.Signer;
  private accountAddress: string;
  private model: ChatGoogleGenerativeAI;

  constructor(signer: ethers.Signer, accountAddress: string) {
    this.signer = signer;
    this.accountAddress = accountAddress;
    
    // Gemini modeli başlat
    this.model = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash",
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
      temperature: 0,
    });
  }

  private async resolveUsername(username: string): Promise<string> {
    const registry = await getSmartAccountRegistry(this.signer);
    const fullUsername = username.endsWith('.units') ? username : `${username}.units`;
    
    const address = await registry.resolveName(fullUsername);
    if (address && address !== ethers.constants.AddressZero) {
      return address;
    }
    throw new Error(`Kullanıcı adı '${username}' bulunamadı`);
  }

  private createTools() {
    return [
      new DynamicTool({
        name: 'send_eth',
        description: 'Send ETH to a recipient. Input should be a JSON string with recipient (username or address) and amount in ETH.',
        func: async (input: string) => {
          try {
            const { recipient, amount } = JSON.parse(input);
            
            // Resolve username if not an address
            let resolvedAddress = recipient;
            if (!recipient.startsWith('0x')) {
              resolvedAddress = await this.resolveUsername(recipient);
            } else if (!ethers.utils.isAddress(recipient)) {
              throw new Error('Invalid Ethereum address');
            }

            // Format amount properly
            let formattedAmount: string;
            if (typeof amount === 'number') {
              formattedAmount = amount.toString();
            } else if (typeof amount === 'string') {
              formattedAmount = amount.replace(/[^\d.]/g, '');
            } else {
              throw new Error('Invalid amount format');
            }

            // Send transaction using the same function as the button
            await sendSingleTransaction(
              this.signer,
              this.accountAddress,
              resolvedAddress,
              formattedAmount
            );

            return `✅ İşlem başarıyla gönderildi!\nAlıcı: ${recipient}\nMiktar: ${formattedAmount} ETH`;
          } catch (error) {
            console.error('Transaction error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
            throw new Error(`İşlem başarısız: ${errorMessage}`);
          }
        },
      }),
      new DynamicTool({
        name: 'send_batch_eth',
        description: 'Send ETH to multiple recipients in a batch. Input should be a JSON string with recipients array and amounts array.',
        func: async (input: string) => {
          try {
            const { recipients, amounts } = JSON.parse(input);
            
            if (!Array.isArray(recipients) || !Array.isArray(amounts)) {
              throw new Error('Recipients and amounts must be arrays');
            }

            if (recipients.length !== amounts.length) {
              throw new Error('Recipients and amounts arrays must have the same length');
            }

            // Resolve all usernames to addresses
            const resolvedAddresses = await Promise.all(
              recipients.map(async (recipient) => {
                if (!recipient.startsWith('0x')) {
                  return await this.resolveUsername(recipient);
                } else if (!ethers.utils.isAddress(recipient)) {
                  throw new Error(`Invalid Ethereum address: ${recipient}`);
                }
                return recipient;
              })
            );

            // Format all amounts
            const formattedAmounts = amounts.map((amount) => {
              if (typeof amount === 'number') {
                return amount.toString();
              } else if (typeof amount === 'string') {
                return amount.replace(/[^\d.]/g, '');
              }
              throw new Error('Invalid amount format');
            });

            // Send batch transaction using the same function as the button
            await sendBatchTransactions(
              this.signer,
              this.accountAddress,
              resolvedAddresses,
              formattedAmounts
            );

            // Create summary of transactions
            const summary = recipients.map((recipient, i) => 
              `${recipient}: ${amounts[i]} ETH`
            ).join('\n');

            return `✅ Batch işlem başarıyla gönderildi!\n\nÖzet:\n${summary}`;
          } catch (error) {
            console.error('Batch transaction error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
            throw new Error(`Batch işlem başarısız: ${errorMessage}`);
          }
        },
      }),
      new DynamicTool({
        name: 'fund_account',
        description: 'Fund the smart account with ETH from EOA wallet. Input should be a JSON string with amount in ETH.',
        func: async (input: string) => {
          try {
            console.log('Fund account tool input:', input);
            const { amount } = JSON.parse(input);
            console.log('Parsed amount:', amount, typeof amount);

            // Format amount properly
            let formattedAmount: string;
            if (typeof amount === 'number') {
              formattedAmount = amount.toString();
            } else if (typeof amount === 'string') {
              // Remove any non-numeric characters except dot
              formattedAmount = amount.replace(/[^\d.]/g, '');
            } else {
              throw new Error('Invalid amount format');
            }

            console.log('Formatted amount:', formattedAmount);
            
            // Validate amount
            const parsedAmount = parseFloat(formattedAmount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
              throw new Error('Miktar sıfırdan büyük olmalıdır');
            }

            // Send ETH from EOA to AA wallet
            console.log('Sending ETH to AA wallet...');
            console.log('Signer:', this.signer);
            console.log('Account address:', this.accountAddress);
            
            const tx = await sendEthToAAWallet(
              this.signer,
              this.accountAddress,
              formattedAmount
            );
            console.log('Transaction result:', tx);

            return `✅ Smart Account başarıyla fonlandı!\nGönderilen: ${formattedAmount} ETH\nAlıcı Hesap: Smart Account`;
          } catch (error) {
            console.error('Fund account tool error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
            throw new Error(`Fonlama başarısız: ${errorMessage}`);
          }
        },
      }),
    ];
  }

  private extractJsonFromResponse(content: string): { 
    recipient?: string; 
    recipients?: string[];
    amount?: number;
    amounts?: number[];
  } | null {
    try {
      const jsonMatch = content.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        return JSON.parse(jsonStr);
      }
      return null;
    } catch {
      return null;
    }
  }

  private formatResponse(content: string): string {
    // Markdown formatında yanıt oluştur
    return content
      .replace(/```tool_code/g, '')
      .replace(/```/g, '')
      .trim();
  }

  public async processMessage(message: string): Promise<string> {
    try {
      // Gemini ile konuş
      const response = await this.model.invoke([
        ["system", `Sen yardımcı bir AI asistanısın. Kripto para transferleri yapabilir ve genel sohbet edebilirsin.
         
         Kullanıcı tek bir ETH transferi istediğinde:
         1. Mesajı analiz et ve alıcı ile miktarı belirle
         2. JSON formatında yanıt ver: {"recipient": "kullanıcı_adı", "amount": miktar}
         3. JSON'dan önce ve sonra bir açıklama ekle
         
         Kullanıcı birden fazla kişiye ETH transferi istediğinde (batch):
         1. Mesajı analiz et ve alıcılar ile miktarları belirle
         2. JSON formatında yanıt ver: {"recipients": ["kullanıcı1", "kullanıcı2"], "amounts": [miktar1, miktar2]}
         3. JSON'dan önce ve sonra bir açıklama ekle
         
         Kullanıcı Smart Account'u fonlamak istediğinde (EOA -> AA transfer):
         1. Mesajı analiz et ve miktarı belirle (örn: "hesabıma/smart account'a/cüzdanıma X eth yükle/gönder")
         2. JSON formatında yanıt ver: {"amount": miktar}
         3. JSON'dan önce ve sonra bir açıklama ekle
         
         Genel sohbet için:
         - Doğal ve samimi bir şekilde yanıt ver
         - Her zaman Türkçe konuş
         - Nazik ve yardımsever ol
         
         Örnek kullanımlar:
         - "ali'ye 1 eth gönder" -> send_eth tool'u: {"recipient": "ali", "amount": 1}
         - "ali ve veli'ye 1'er eth gönder" -> send_batch_eth tool'u: {"recipients": ["ali", "veli"], "amounts": [1, 1]}
         - "hesabıma 2 eth yükle" -> fund_account tool'u: {"amount": 2}`],
        ["human", message]
      ]);

      const content = response.content as string;
      
      // JSON içeren yanıtları işle
      const txDetails = this.extractJsonFromResponse(content);
      if (txDetails) {
        const tools = this.createTools();
        // Tool seçimi: recipients varsa batch, recipient varsa single, yoksa fund
        const tool = txDetails.recipients ? tools[1] : txDetails.recipient ? tools[0] : tools[2];
        const result = await tool.func(JSON.stringify(txDetails));
        return this.formatResponse(result);
      }

      // Normal sohbet yanıtını döndür
      return this.formatResponse(content);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new Error(`Agent hatası: ${errorMessage}`);
    }
  }
} 