<?php

namespace App\Services;

use App\Models\Message\Message;
use App\Models\User\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiAssistantService
{
    /**
     * Generate a response from Google Gemini based on sanitized chat history
     */
    public function generateResponse(User $user, User $aiBot): ?string
    {
        try {
            // 0. Verify Key exists before attempting network calls
            $apiKey = env('GEMINI_API_KEY');
            if (empty($apiKey)) {
                Log::error('Gemini API Error: GEMINI_API_KEY is missing or empty in .env');
                return "My API key hasn't been loaded by the server yet! Please check your .env file and restart 'php artisan serve'.";
            }

            // 1. Fetch the last 10 messages between the User and the AI Bot[cite: 9]
            $recentMessages = Message::where(function ($q) use ($user, $aiBot) {
                    $q->where('sender_id', $user->id)->where('receiver_id', $aiBot->id);
                })
                ->orWhere(function ($q) use ($user, $aiBot) {
                    $q->where('sender_id', $aiBot->id)->where('receiver_id', $user->id);
                })
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->reverse();

            // 2. SANITIZE HISTORY: Gemini strictly requires alternating roles (user -> model -> user -> model)
            $contents = [];
            $lastRole = null;
            
            foreach ($recentMessages as $msg) {
                // Ignore our own previous error messages so we don't feed bad context to the AI
                if (str_contains($msg->body, "trouble connecting to my knowledge base") || str_contains($msg->body, "API key hasn't been loaded")) {
                    continue;
                }

                $role = $msg->sender_id === $user->id ? 'user' : 'model';
                
                // If the user sent 2 messages in a row without an AI reply, combine them!
                if ($role === $lastRole && !empty($contents)) {
                    $lastIndex = count($contents) - 1;
                    $contents[$lastIndex]['parts'][0]['text'] .= "\n\n" . $msg->body;
                } else {
                    $contents[] = [
                        'role' => $role,
                        'parts' => [
                            ['text' => $msg->body]
                        ]
                    ];
                    $lastRole = $role;
                }
            }

            // Gemini API rule: The conversation history MUST start with a 'user' role
            if (!empty($contents) && $contents[0]['role'] === 'model') {
                array_unshift($contents, [
                    'role' => 'user',
                    'parts' => [['text' => 'Hello!']]
                ]);
            }

            // Fallback if no valid messages remain
            if (empty($contents)) {
                $contents[] = [
                    'role' => 'user',
                    'parts' => [['text' => 'Hello!']]
                ];
            }

            // 3. Define your primary and substitute/fallback models using active Google identifiers
            $models = [
                'gemini-1.5-flash',     
                'gemini-2.5-flash',      
                'gemini-1.5-pro',        
                'gemini-2.5-flash-lite'  
            ];

            $apiResponseText = null;
            $lastErrorDetails = '';

            foreach ($models as $model) {
                try {
                    $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

                    $response = Http::withoutVerifying() 
                        ->timeout(12) // Slightly shorter timeout per model to keep the UI snappy
                        ->withHeaders(['Content-Type' => 'application/json'])
                        ->post($endpoint, [
                            'contents' => $contents,
                            'systemInstruction' => [
                                'parts' => [
                                    ['text' => "You are the StayFinder AI Support Assistant. You help users with booking stays, understanding experiences, and navigating the platform. Be concise, friendly, and helpful."]
                                ]
                            ],
                            'generationConfig' => [
                                'maxOutputTokens' => 300,
                                'temperature' => 0.7,
                            ]
                        ]);

                    // If this specific model succeeds, capture text and break the loop immediately
                    if ($response->successful()) {
                        $apiResponseText = $response->json('candidates.0.content.parts.0.text');
                        if (!empty($apiResponseText)) {
                            break; 
                        }
                    }

                    // If it did not succeed, capture error data and let the loop proceed to the next model
                    $lastErrorDetails = "Model {$model} failed with status: " . $response->status() . " - " . $response->body();
                    Log::warning("Gemini Fallback Triggered: " . $lastErrorDetails);

                } catch (\Exception $modelException) {
                    $lastErrorDetails = "Model {$model} threw exception: " . $modelException->getMessage();
                    Log::warning("Gemini Fallback Triggered: " . $lastErrorDetails);
                }
            }

            // 4. Return the successfully generated text, or fall back to the user error response
            if (!empty($apiResponseText)) {
                return $apiResponseText;
            }

            // Log the cumulative error if ALL models failed
            Log::error('Gemini API Ultimate Failure. Last error checked: ' . $lastErrorDetails);
            return "I'm having a little trouble connecting to my knowledge base right now. Please try again in a moment!";
        } catch (\Exception $e) {
            Log::error('Gemini Service Exception: ' . $e->getMessage());
            return "Sorry, I encountered a network error while processing your request.";
        }
    }
}