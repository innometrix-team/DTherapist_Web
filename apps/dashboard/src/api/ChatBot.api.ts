import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Api, { IAPIResult } from "./Api";

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
    
    return Promise.resolve({
      code: response.status,
      status: 'success',
      message: "Response received successfully",
      data: response.data.reply
    });
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data.status || "error";
    
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}

// Send message with streaming support (for real-time responses)
export async function sendChatbotMessageStreaming(
  data: SendChatbotMessageRequest,
  onToken?: (token: string) => void,
  config?: AxiosRequestConfig
): Promise<IAPIResult<string> | null> {
  try {
    const response = await Api.post(
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

    // Handle streaming response if supported
    if (response.data && typeof response.data.pipe === 'function') {
      let fullResponse = '';
      
      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Uint8Array) => {
          const decoder = new TextDecoder();
          const token = decoder.decode(chunk);
          fullResponse += token;
          
          // Call the token callback for real-time updates
          if (onToken) {
            onToken(token);
          }
        });

        response.data.on('end', () => {
          resolve({
            code: response.status,
            status: 'success',
            message: 'Streaming response completed',
            data: fullResponse
          });
        });

        response.data.on('error', (error: Error) => {
          reject({
            code: 500,
            status: 'error',
            message: error.message,
            data: undefined
          });
        });
      });
    } else {
      // Fallback to regular response
      const result = response.data as ChatbotResponse;
      return Promise.resolve({
        code: response.status,
        status: 'success',
        message: "Response received successfully",
        data: result.reply
      });
    }
  } catch (e) {
    if (axios.isCancel(e)) {
      return Promise.resolve(null);
    }

    const statusCode = (e as AxiosError).response?.status || 0;
    const errorMessage =
      (e as AxiosError<IAPIResult>).response?.data.message ||
      (e as Error).message;
    const status = (e as AxiosError<IAPIResult>).response?.data.status || "error";
    
    return Promise.reject({
      code: statusCode,
      status,
      message: errorMessage,
      data: undefined,
    });
  }
}