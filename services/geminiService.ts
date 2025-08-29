
import { GoogleGenAI, Type } from "@google/genai";
import type { Todo } from '../types';
import { Priority } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const translatePriority = (priority: Priority): string => {
  switch (priority) {
    case Priority.High: return '高';
    case Priority.Medium: return '中';
    case Priority.Low: return '低';
    default: return '中';
  }
}

export const getSmartSortedTasks = async (tasks: Todo[]): Promise<string[]> => {
  if (tasks.length < 2) {
    return tasks.map(t => t.text);
  }

  const taskDescriptions = tasks.map(task => `- ${task.text} (优先级: ${translatePriority(task.priority)})`).join('\n');

  const prompt = `
    作为一名效率专家，请根据以下待办事项清单（包含优先级），按紧急程度、重要性、优先级和预估精力进行重新排序。
    请高度重视“高”优先级的任务。
    仅返回一个 JSON 字符串数组，其中每个字符串都是原始列表中任务的精确文本。
    不要添加新任务或修改现有任务的文本。

    待办列表:
    ${taskDescriptions}
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const sortedTaskTexts = JSON.parse(jsonString);

    if (Array.isArray(sortedTaskTexts) && sortedTaskTexts.every(item => typeof item === 'string')) {
      return sortedTaskTexts as string[];
    } else {
      console.error("Gemini API returned an unexpected format:", sortedTaskTexts);
      throw new Error('API did not return a valid string array.');
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("无法智能排序任务。请稍后再试。");
  }
};
