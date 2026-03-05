
import { GoogleGenAI, Type } from "@google/genai";
import { PlantDiagnosisResult } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const diagnosisSchema = {
  type: Type.OBJECT,
  properties: {
    plantName: { type: Type.STRING, description: "식물의 이름 (식별 가능한 경우)" },
    diagnosis: { type: Type.STRING, description: "식물의 현재 상태 또는 질병명" },
    cause: { type: Type.STRING, description: "증상의 주요 원인" },
    treatment: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "치료를 위한 구체적인 조치 사항들" 
    },
    preventiveMeasures: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "향후 예방을 위한 조언들" 
    },
    severity: { 
      type: Type.STRING, 
      enum: ["low", "medium", "high"],
      description: "상태의 심각도 (낮음, 보통, 높음)"
    },
  },
  required: ["plantName", "diagnosis", "cause", "treatment", "preventiveMeasures", "severity"],
};

export const diagnosePlantByImage = async (base64Image: string, mimeType: string): Promise<PlantDiagnosisResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: "이 식물의 상태를 분석해줘. 식물 이름, 진단 결과, 원인, 치료 방법, 예방 조치, 심각도를 한국어로 상세히 알려줘. JSON 형식으로 응답해." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: diagnosisSchema,
    }
  });

  return JSON.parse(response.text || "{}") as PlantDiagnosisResult;
};

export const diagnosePlantByText = async (description: string): Promise<PlantDiagnosisResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `다음 식물 증상 설명을 바탕으로 진단해줘: "${description}". 식물 이름(추정), 진단 결과, 원인, 치료 방법, 예방 조치, 심각도를 한국어로 상세히 알려줘. JSON 형식으로 응답해.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: diagnosisSchema,
    }
  });

  return JSON.parse(response.text || "{}") as PlantDiagnosisResult;
};
