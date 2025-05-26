
import { GoogleGenAI } from "@google/genai";
import type { AIPromptDetails } from '../types';

// Ensure API_KEY is available in the environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is not set in environment variables. Gemini Service will not work.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_API_KEY" }); // Provide a fallback for type safety, but it won't work without a real key.

export const generateJobDescription = async (details: AIPromptDetails): Promise<string> => {
  if (!apiKey) {
    return Promise.resolve("ข้อผิดพลาด: ไม่สามารถเชื่อมต่อกับ AI ได้เนื่องจาก API Key ไม่ถูกต้อง (ฟังก์ชัน AI ถูกปิดใช้งานชั่วคราว โปรดกรอกรายละเอียดงานด้วยตนเอง)");
  }
  try {
    const model = 'gemini-2.5-flash-preview-04-17';
    const prompt = `คุณเป็นผู้ช่วยเขียนประกาศงาน โปรดช่วยร่างรายละเอียดประกาศรับสมัครงานด่วนในเชียงใหม่ โดยมีข้อมูลดังนี้:
ลักษณะงานคือ "${details.taskType}",
สถานที่คือ "${details.locationDetails}",
วันและเวลาทำงานคือ "${details.schedule}",
และค่าตอบแทนคือ "${details.compensationDetails}".
กรุณาใช้ภาษาไทยที่สุภาพ เป็นมิตร กระชับ และดึงดูดให้คนสนใจสมัครงาน`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating job description with Gemini:", error);
    return "ขออภัย เกิดข้อผิดพลาดในการสร้างรายละเอียดงานด้วย AI โปรดลองอีกครั้งหรือกรอกด้วยตนเอง";
  }
};
