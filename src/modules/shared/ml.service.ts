import { Injectable } from '@nestjs/common';
import { integer } from 'aws-sdk/clients/cloudfront';
import axios from 'axios';

@Injectable()
export class MlService {
  private readonly mlServerUrl = `${process.env.MLS_PROTOCOL}://${process.env.MLS_IP}`;

  async generateEmbeddings(bot_id: integer): Promise<any> {
    try {
      const response = await axios.post(`${this.mlServerUrl}/gen_embeddings`, {
        bot_id,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }
}
