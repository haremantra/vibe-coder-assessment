# Refactor Test Notes - LLM-Driven Chat Assessment

## Test 1: Start Fresh Flow
- Session persistence detected the old session and offered Resume/Start Fresh ✅
- Clicked "Start Fresh" — abandoned old session, created new one ✅
- Opening message rendered correctly with scripted greeting ✅
- Header shows "Project Grounding" at 0% ✅

## Test 2: First Conversation Turn
- User message: described a personal finance tracker project
- Bot response: "Got it — a personal finance tracker to categorize expenses and visualize spending trends, built with React and Supabase. I'll use this as our reference point throughout. Every question will be about what you actually did on this specific project."
- The LLM correctly echo-backed the project description (per the design doc)
- Then transitioned: "Starting at the very beginning of that project: before you wrote your first prompt or generated any code, what did you do first?"
- This is the Problem Framing primary question — correct per the script ✅
- Progress updated to 5% ✅
- Typing indicator appeared during LLM call ✅

## Key Observations
- The LLM is following the chatbot script faithfully
- Echo-back of project description works as designed
- Transition to first attribute question is natural
- No tier names or scores revealed during conversation
- Response time was ~3 seconds (acceptable for batch mode)
