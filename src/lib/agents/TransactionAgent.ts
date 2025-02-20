import { DynamicTool } from '@langchain/core/tools';
import { ethers } from 'ethers';
import { sendSingleTransaction } from '../services/wallet';
import { getSmartAccountRegistry } from '../services/contracts';
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
            const resolvedAddress = recipient.startsWith('0x') 
              ? recipient 
              : await this.resolveUsername(recipient);

            // Send transaction
            await sendSingleTransaction(
              this.signer,
              this.accountAddress,
              resolvedAddress,
              amount.toString()
            );

            return `✅ İşlem başarıyla gönderildi!\nAlıcı: ${recipient}\nMiktar: ${amount} ETH`;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
            throw new Error(`İşlem başarısız: ${errorMessage}`);
          }
        },
      }),
    ];
  }

  private extractJsonFromResponse(content: string): { recipient: string; amount: number } | null {
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
         
         Kullanıcı ETH göndermek istediğinde:
         1. Mesajı analiz et ve alıcı ile miktarı belirle
         2. JSON formatında yanıt ver: {"recipient": "kullanıcı_adı", "amount": miktar}
         3. JSON'dan önce ve sonra bir açıklama ekle
         
         Genel sohbet için:
         - Doğal ve samimi bir şekilde yanıt ver
         - Her zaman Türkçe konuş
         - Nazik ve yardımsever ol`],
        ["human", message]
      ]);

      const content = response.content as string;
      
      // JSON içeren yanıtları işle
      const txDetails = this.extractJsonFromResponse(content);
      if (txDetails) {
        const tool = this.createTools()[0];
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