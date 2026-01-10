<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1w5zr94juYuAitXBEJ7UyqWGezCygif0F

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `OPENROUTER_API_KEY` in [.env.local](.env.local) to your OpenRouter API key
3. Run the app:
   `npm run dev`


------------------------------------------------------------------------
Description:

What this app does (high-level)
An AI-powered snake identification app that analyzes images or descriptions to identify snake species, assess danger levels, and provide safety and first-aid guidance.

Snake Identifier is an AI-powered app that helps users identify snakes from an image or description and understand how dangerous they are.
The app uses AI to Identify a snake, assess the danger, and explain what to do next:
-The goal of the app is education and safety, especially in situations where someone encounters an unknown snake.
-Analyze an image or text input related to a snake
-Identify the snake species (if possible)
-Determine whether the snake is venomous and the level of danger (Safe, Moderate, High, Critical)
-Explain the risk level to humans
-Provide safety guidance and first-aid information:
    -What to do if you encounter the snake
    -How to avoid bites
    -General prevention tips
    -Clear advice written for non-experts
    -If the snake is venomous, the app provides:
         -Step-by-step first-aid guidance
         -Actions to take immediately
         -Actions to avoid (important for snake bites)
-Provide detailed snake information:
    -Physical description
    -Typical behavior
    -Active time (day/night)
    -Diet
    -Habitat
    -Geographic range
    -Venom toxicity details
    -How aggressive or defensive the snake is
-If a snake is detected, the app attempts to identify:
    -Scientific name
    -Common name
    -Confidence score (0–100%) indicating how sure the AI is
-Confidence & uncertainty handling. If the AI is not confident, it:
    -Lowers the confidence score
    -Avoids making dangerous claims
    -If no snake is detected: Clearly states that no identification was made
-Available in English & Thai



Modern web app stack, the app uses:
-TypeScript (type-safe)
-Vite (fast development server)
-Node.js
-Google GenAI SDK
-Modular service architecture

Can be deployed as a web app or extended into a mobile app
What this app is not
❌ Not a medical diagnosis tool
❌ Not a replacement for emergency services
❌ Not guaranteed 100% accurate (AI-based)



