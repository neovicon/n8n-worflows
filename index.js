{
  "name": "Seedream Image Generation Workflow",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "cronExpression": "0 9 * * *"
            }
          ]
        }
      },
      "id": "f8b5c3d1-4e2a-4b3c-9d1e-2f3a4b5c6d7e",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [
        240,
        300
      ],
      "description": "Triggers daily at 9 AM"
    },
    {
      "parameters": {
        "jsCode": "// Test prompt for image generation\nconst testPrompt = \"A majestic golden retriever sitting in a sunlit meadow filled with wildflowers, photorealistic style, high detail, warm lighting, beautiful landscape background\";\n\n// Prepare the request body for Seedream API\nconst requestBody = {\n  model: \"doubao-seedream-4-0-250828\",\n  prompt: testPrompt,\n  width: 1024,\n  height: 1024,\n  steps: 25,\n  guidance_scale: 7.5,\n  seed: Math.floor(Math.random() * 1000000)\n};\n\nreturn {\n  prompt: testPrompt,\n  requestBody: requestBody,\n  timestamp: new Date().toISOString()\n};"
      },
      "id": "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
      "name": "Prepare Request Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        460,
        300
      ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.comet.com/api/v1/image/generate",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer {{$credentials.seedreamApiKey}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "model",
              "value": "={{$json.requestBody.model}}"
            },
            {
              "name": "prompt", 
              "value": "={{$json.requestBody.prompt}}"
            },
            {
              "name": "width",
              "value": "={{$json.requestBody.width}}"
            },
            {
              "name": "height", 
              "value": "={{$json.requestBody.height}}"
            },
            {
              "name": "steps",
              "value": "={{$json.requestBody.steps}}"
            },
            {
              "name": "guidance_scale",
              "value": "={{$json.requestBody.guidance_scale}}"
            },
            {
              "name": "seed",
              "value": "={{$json.requestBody.seed}}"
            }
          ]
        },
        "options": {
          "timeout": 60000,
          "retry": {
            "enabled": true,
            "maxAttempts": 3,
            "waitBetweenAttempts": 5000
          }
        }
      },
      "id": "b2c3d4e5-6f7g-8h9i-0j1k-l2m3n4o5p6q7",
      "name": "Generate Image - Seedream API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [
        680,
        300
      ],
      "onError": "continueErrorOutput"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "c3d4e5f6-7g8h-9i0j-1k2l-m3n4o5p6q7r8",
              "leftValue": "={{$json.error}}",
              "rightValue": "",
              "operator": {
                "type": "object",
                "operation": "notExists",
                "singleValue": true
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "d4e5f6g7-8h9i-0j1k-2l3m-n4o5p6q7r8s9",
      "name": "Check API Response",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [
        900,
        300
      ]
    },
    {
      "parameters": {
        "jsCode": "// Extract successful response data\nconst apiResponse = $input.all()[0].json;\n\n// Extract image URL from response \n// This assumes the API returns an image URL in the response\n// Adjust the path based on actual API response structure\nconst imageUrl = apiResponse.data?.url || apiResponse.url || apiResponse.image_url || apiResponse.output?.url;\n\nif (!imageUrl) {\n  throw new Error('No image URL found in API response');\n}\n\nreturn {\n  success: true,\n  imageUrl: imageUrl,\n  prompt: $json.requestBody?.prompt || 'Unknown prompt',\n  timestamp: new Date().toISOString(),\n  message: 'Image generated successfully',\n  apiResponse: apiResponse\n};"
      },
      "id": "e5f6g7h8-9i0j-1k2l-3m4n-o5p6q7r8s9t0",
      "name": "Process Success Response",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1120,
        200
      ]
    },
    {
      "parameters": {
        "jsCode": "// Process error response\nconst errorData = $input.all()[0];\nconst errorJson = errorData.json || {};\nconst error = errorData.error || {};\n\n// Extract error details\nlet errorMessage = 'Unknown error occurred';\nlet errorCode = 'UNKNOWN_ERROR';\nlet errorDetails = {};\n\n// Check if it's an HTTP error\nif (error.message) {\n  errorMessage = error.message;\n}\n\n// Check if API returned error details\nif (errorJson.error) {\n  errorMessage = errorJson.error.message || errorJson.error;\n  errorCode = errorJson.error.code || errorJson.error.type || 'API_ERROR';\n  errorDetails = errorJson.error;\n}\n\n// Check for common HTTP status codes\nif (error.httpCode) {\n  switch(error.httpCode) {\n    case 401:\n      errorMessage = 'Authentication failed - Check your API key';\n      errorCode = 'AUTHENTICATION_ERROR';\n      break;\n    case 402:\n      errorMessage = 'Insufficient credits or payment required';\n      errorCode = 'PAYMENT_REQUIRED';\n      break;\n    case 429:\n      errorMessage = 'Rate limit exceeded - Too many requests';\n      errorCode = 'RATE_LIMIT_EXCEEDED';\n      break;\n    case 500:\n      errorMessage = 'Internal server error - Try again later';\n      errorCode = 'SERVER_ERROR';\n      break;\n  }\n}\n\nreturn {\n  success: false,\n  error: true,\n  errorMessage: errorMessage,\n  errorCode: errorCode,\n  errorDetails: errorDetails,\n  httpCode: error.httpCode || null,\n  timestamp: new Date().toISOString(),\n  prompt: $json.requestBody?.prompt || 'Unknown prompt'\n};"
      },
      "id": "f6g7h8i9-0j1k-2l3m-4n5o-p6q7r8s9t0u1",
      "name": "Process Error Response", 
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1120,
        400
      ]
    },
    {
      "parameters": {
        "jsCode": "// Combine results from both success and error branches\nconst allInputs = $input.all();\nconst result = allInputs[0].json;\n\n// Create final output\nif (result.success) {\n  console.log('✅ Image Generation Successful');\n  console.log('Image URL:', result.imageUrl);\n  console.log('Prompt:', result.prompt);\n  console.log('Timestamp:', result.timestamp);\n} else {\n  console.log('❌ Image Generation Failed');\n  console.log('Error:', result.errorMessage);\n  console.log('Error Code:', result.errorCode);\n  console.log('HTTP Code:', result.httpCode);\n  console.log('Timestamp:', result.timestamp);\n}\n\nreturn result;"
      },
      "id": "g7h8i9j0-1k2l-3m4n-5o6p-q7r8s9t0u1v2",
      "name": "Final Output",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1340,
        300
      ]
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [
          {
            "node": "Prepare Request Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Prepare Request Data": {
      "main": [
        [
          {
            "node": "Generate Image - Seedream API",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Generate Image - Seedream API": {
      "main": [
        [
          {
            "node": "Check API Response",
            "type": "main",
            "index": 0
          }
        ]
      ],
      "error": [
        [
          {
            "node": "Process Error Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check API Response": {
      "main": [
        [
          {
            "node": "Process Success Response",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Process Error Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Process Success Response": {
      "main": [
        [
          {
            "node": "Final Output",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Process Error Response": {
      "main": [
        [
          {
            "node": "Final Output",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "createdAt": "2025-09-17T00:00:00.000Z",
  "updatedAt": "2025-09-17T00:00:00.000Z",
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": {},
  "tags": [
    {
      "createdAt": "2025-09-17T00:00:00.000Z",
      "updatedAt": "2025-09-17T00:00:00.000Z",
      "id": "tag1",
      "name": "ai-image-generation"
    }
  ],
  "triggerCount": 0,
  "versionId": "1"
}
