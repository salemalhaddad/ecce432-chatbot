import { NextResponse } from 'next/server';
import { chatbotValidator } from '@/lib/validators';
import {
  getAzureChatResponse,
  getChatProviderKey,
  getChatResponse,
  getDefaultProviderKey,
} from '@/lib/intellinode';

const defaultSystemMessage =
  'You are a helpful assistant. Format response in Markdown where needed.';
const defaultProvider = 'openai';

export async function POST(req: Request) {
  const json = await req.json();
  const parsedJson = chatbotValidator.safeParse(json);

  if (!parsedJson.success) {
    const { error } = parsedJson;
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const {
    messages,
    providers,
    provider,
    systemMessage = defaultSystemMessage,
    n = 2,
    withContext,
    intellinodeData,
    oneKey,
  } = parsedJson.data;

  const key =
    (provider && providers[provider]?.apiKey) ||
    getChatProviderKey(provider) ||
    getDefaultProviderKey(provider, oneKey);

  if (!key) {
    console.log('error');
    const missingKeyError = `no api key provided for ${provider}, either add it to your .env file or in the chat settings`;
    return NextResponse.json({ error: missingKeyError }, { status: 400 });
  }

  const contextKey = providers.openai?.apiKey || getChatProviderKey('openai');

  if (withContext && !contextKey) {
    const missingContextKey = `OpenAi key was not provided, either add it to your .env file or in the chat settings`;
    return NextResponse.json({ error: missingContextKey }, { status: 400 });
  }

  if (intellinodeData && !oneKey) {
    const missingOneKey = `oneKey is required when intellinodeData is enabled`;
    return NextResponse.json({ error: missingOneKey }, { status: 400 });
  }

  const chatSystemMessage =
    systemMessage.trim() !== '' ? systemMessage : defaultSystemMessage;
  const chatProvider = provider || defaultProvider;
  const chatProviderProps = providers[chatProvider];

  try {
    if (chatProvider === 'azure' && providers.azure) {
      const responses = await getAzureChatResponse({
        provider: { ...providers.azure, apiKey: key },
        systemMessage: chatSystemMessage,
        withContext,
        messages,
        n,
        oneKey: intellinodeData ? oneKey : undefined,
      });
      return NextResponse.json({ response: responses });
    } else if (chatProviderProps && chatProviderProps?.name !== 'azure') {
      const responses = await getChatResponse({
        provider: { ...chatProviderProps, apiKey: key },
        systemMessage: chatSystemMessage,
        withContext,
        contextKey,
        messages,
        n,
        oneKey: intellinodeData ? oneKey : undefined,
        intellinodeData,
      });
      return NextResponse.json({
        response: responses.result,
        references: responses.references,
      });
    }
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      {
        error: 'invalid api key or provider',
      },
      { status: 400 }
    );
  }
}

export const maxDuration = 180;
