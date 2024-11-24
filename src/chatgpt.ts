import type { Action, Scene } from "./stores/game";
import { useEditorStore } from "./stores/editor";

// Define the JSON schema for the expected response
const jsonSchema = {
    "type": "object",
    "additionalProperties": false,
    "required": ["text", "text2", "actions"],
    "properties": {
        "id": { "type": "string" },
        "text": { "type": "string" },
        "actions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": { "type": "string" },
                    "nextScene": { "type": "string" }
                },
                "required": ["title"],
                "additionalProperties": false
            }
        }
    }
}

// Base prompt template
const basePrompt = `
You are an assistant helping write a text-based game. 
You will be given a sequence of scenes and an action. 
This action leads to a new scene, which has its own actions. 
Your task is to return the new scene in JSON format.

Scene JSON Schema:
- "text": Description shown on the first visit (max 100 chars, with sentences ≤ 50 chars).
- "actions": List of actions available in this scene
- Each action has a "title" (max 30 chars) and "nextScene" (ID of the scene it leads to).
_ Try to include an action that leads back to the previous scene, if applicable (but only one)
- Do not include actions that jump to any scene other than the previous scene.
- Use similar writing style and tone as the provided scenes.

Constraints:
- JSON output must strictly follow the schema.
- Text must be concise, clear, and immersive.

Given the current scene sequence and the selected action, generate the next scene:
`;

export const aiGenerateScene = async (scenePath: Scene[], action: Action, extraPrompt: string) => {
    const editorStore = useEditorStore();

    const parsedScenePath: {
        id?: string;
        text: string;
        action?: string;
    }[] = [];
    parsedScenePath.unshift({
        id: scenePath[scenePath.length - 1].id,
        text: scenePath[scenePath.length - 1].text,
        action: action.title,
    })
    for (let i = scenePath.length - 2; i >= 0; i--) {
        const scene = scenePath[i];
        if (!scene) {
            break;
        }
        const currAction = scene.actions.find(a => a.nextScene === parsedScenePath[0].id)?.title;
        if (!currAction) {
            console.error("No action found for scene", scene.id);
            console.error("Scene:", scene.actions);
        }
        parsedScenePath.unshift({
            id: scenePath[i].id,
            text: scenePath[i].text,
            action: currAction,
        })
    }
    // Remove ID from all but the last scene
    parsedScenePath.forEach((scene, index) => {
        if (index !== parsedScenePath.length - 1) {
            delete scene.id;
        }
    });

    // Construct the prompt dynamically
    let prompt = `
${basePrompt}

Current Scene Path:
${JSON.stringify(parsedScenePath, null, 2)}

Generate the next scene:
`.trim();

    if (editorStore.state.extraPrompt) {
        prompt += "\n\nTietoa tarinasta: " + editorStore.state.extraPrompt;
    }

    if (extraPrompt) {
        prompt += "\n\nLisätietoa seuraavasta scenestä: " + extraPrompt;
    }

    console.log("Prompt:", prompt);
    try {
        // Call OpenAI Chat Completions API
        const promptData = {
            model: "gpt-4o",
            messages: [
                { role: "system", content: basePrompt },
                { role: "user", content: prompt }
            ],
            functions: [{ name: "schema", parameters: jsonSchema }],
            function_call: "auto"
        };

        // Call backend using fetch
        const completion = await (await fetch("/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(promptData)
        })).json();
        console.log("completion", completion);

        // Extract and return the new scene from the response
        let newScene = completion.choices?.[0]?.message?.function_call?.arguments;
        if (!newScene) {
            newScene = completion.choices?.[0]?.message?.content.replace(/```json|```/g, '').trim();
        }

        if (!newScene) {
            throw new Error("No valid scene generated.");
        }
        return JSON.parse(newScene);
    } catch (error) {
        console.error("Error generating scene:", error);
        throw error;
    }
};
