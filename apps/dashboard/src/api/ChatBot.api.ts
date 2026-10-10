import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { ApiError, IAPIResult } from "./Api";

// Types for Chatbot API
export interface ChatbotMessage {
  message: string;
}

export interface ChatbotResponse {
  reply: string;
}

export interface SendChatbotMessageRequest {
  message: string;
  role?: string; // Optional role parameter
}

interface StreamResponseLike {
  pipe?: (dest: unknown) => unknown;
  on: (
    event: string,
    listener: ((chunk: Uint8Array) => void) | (() => void) | ((error: Error) => void)
  ) => void;
}

// Send a message to the AI chatbot
export async function sendChatbotMessage(
  data: SendChatbotMessageRequest,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> {
  try {
    const response = await Api.post<ChatbotResponse>(
      '/api/chatbot/chat',
      data,
      config
    );
    
    return {
      code: response.status,
      status: 'success',
      message: "Response received successfully",
      data: response.data.reply
    };
  } catch (e) {
    if (axios.isCancel(e)) {
      return null;
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data.status || "error";
    
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}

// Send message with streaming support (for real-time responses)
export async function sendChatbotMessageStreaming(
  data: SendChatbotMessageRequest,
  onToken?: (token: string) => void,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> {
  try {
    const response = await Api.post<unknown>(
      '/api/chatbot/chat',
      data,
      {
        ...config,
        responseType: 'stream', // Enable streaming
        headers: {
          ...config?.headers,
          'Accept': 'text/event-stream',
        }
      }
    );

    const streamData = response.data as StreamResponseLike | null | undefined;

    // Handle streaming response if supported
    if (streamData && typeof streamData.pipe === 'function' && typeof streamData.on === 'function') {
      let fullResponse = '';
      
      return new Promise<IAPIResult<string>>((resolve, reject) => {
        streamData.on('data', (chunk: Uint8Array) => {
          const decoder = new TextDecoder();
          const token = decoder.decode(chunk);
          fullResponse += token;
          
          if (onToken) {
            onToken(token);
          }
        });

        streamData.on('end', () => {
          resolve({
            code: response.status,
            status: 'success',
            message: 'Streaming response completed',
            data: fullResponse
          });
        });

        streamData.on('error', (error: Error) => {
          reject(new ApiError(error.message, 500, 'error'));
        });
      });
    } else {
      // Fallback to regular response
      const result = response.data as ChatbotResponse;
      return {
        code: response.status,
        status: 'success',
        message: "Response received successfully",
        data: result?.reply || ''
      };
    }
  } catch (e) {
    if (axios.isCancel(e)) {
      return null;
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data.status || "error";
    
    return Promise.reject(new ApiError(errorMessage, statusCode, status));
  }
}