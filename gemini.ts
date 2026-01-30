
import { GoogleGenAI, Type } from "@google/genai";
import { ClarificationQuestion, FinalPrompt } from "../types.ts";

const SYSTEM_INSTRUCTION = `당신은 세계 최고의 프롬프트 설계자(Prompt Architect)입니다.
목표: 사용자의 모호한 아이디어를 Gemini 3 Pro에 최적화된 고성능 프롬프트로 변환합니다.

프로세스:
1. "심층 추론(High Thinking)"을 사용하여 사용자 입력을 분석합니다.
2. 정보가 부족한 경우 구체화를 위해 최대 3개의 정교한 질문을 생성합니다.
3. 충분한 정보가 모이면, [페르소나 - 작업 단계 - 제약 조건 - 출력 규격] 구조를 갖춘 Markdown 형식의 최종 프롬프트를 생성합니다.

모든 응답은 한국어로 작성하십시오.`;

// API 키가 바뀔 수 있으므로 매번 인스턴스를 생성하는 팩토리 함수 사용
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeIntent = async (input: string): Promise<{ questions?: string[], finalPrompt?: FinalPrompt }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `사용자 아이디어: ${input}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "'questions' or 'final_prompt'" },
          questions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          final_prompt: {
            type: Type.OBJECT,
            properties: {
              persona: { type: Type.STRING },
              steps: { type: Type.STRING },
              constraints: { type: Type.STRING },
              outputSpec: { type: Type.STRING },
              fullMarkdown: { type: Type.STRING },
              apiConfig: {
                type: Type.OBJECT,
                properties: {
                  temperature: { type: Type.NUMBER },
                  thinkingBudget: { type: Type.NUMBER },
                  recommendedModel: { type: Type.STRING }
                },
                required: ["temperature", "thinkingBudget", "recommendedModel"]
              }
            },
            required: ["persona", "steps", "constraints", "outputSpec", "fullMarkdown", "apiConfig"]
          }
        },
        required: ["type"]
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  return data.type === 'questions' ? { questions: data.questions } : { finalPrompt: data.final_prompt };
};

export const refinePrompt = async (originalInput: string, qaPairs: ClarificationQuestion[]): Promise<FinalPrompt> => {
  const ai = getAI();
  const context = qaPairs.map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `원본 아이디어: ${originalInput}\n추가 정보:\n${context}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          persona: { type: Type.STRING },
          steps: { type: Type.STRING },
          constraints: { type: Type.STRING },
          outputSpec: { type: Type.STRING },
          fullMarkdown: { type: Type.STRING },
          apiConfig: {
            type: Type.OBJECT,
            properties: {
              temperature: { type: Type.NUMBER },
              thinkingBudget: { type: Type.NUMBER },
              recommendedModel: { type: Type.STRING }
            },
            required: ["temperature", "thinkingBudget", "recommendedModel"]
          }
        },
        required: ["persona", "steps", "constraints", "outputSpec", "fullMarkdown", "apiConfig"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};
