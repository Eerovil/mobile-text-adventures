/* 
example json

    {
      "id": "q1aci5lvf",
      "title": "Metsän reunalla",
      "text": "Olet metsän reunalla",
      "text2": "Metsä on pimeä ja synkkä",
      "actions": [
        {
          "title": "Mene bussipysäkille",
        },
        {
          "title": "Mene metsään",
        }
      ],
    },

    */

import type { Action, Scene } from "./stores/game"

// create a json schema for the above json
const jsonSchema = {
    "name": "Scene",
    "strict": true,
    "schema": {
        "type": "object",
        "additionalProperties": false,
        "required": ["title", "text", "text2", "actions"],
        "properties": {
            "title": {
                "type": "string"
            },
            "text": {
                "type": "string"
            },
            "text2": {
                "type": "string"
            },
            "actions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string"
                        }
                    },
                    "required": ["title"],
                    "additionalProperties": false
                }
            }
        }
    }
}

const getNewScene = (scenePath: Scene[], action: Action) => {
    // Create a prompt using the scenePath and action
    // Ask chatgpt assistant to generate a new scene
    // Return the new scene

    let prompt = `Create a new scene based on the following scene path:`
    prompt += `\n\n`
    prompt += JSON.stringify(scenePath);
    prompt += `\n\n`
    prompt += `Action: ${action.title}`
    prompt += `\n\n`

    console.log(prompt)
    return
}
