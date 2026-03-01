# Chat Assessment Test Notes

## Working correctly:
- Intro message displays with markdown formatting (bold text)
- First grounding question appears after 1.5s delay
- User can type and submit responses
- Progress bar updates (0% → 6% → 11%)
- Stage label updates in header ("Project Context" → "Problem Framing")
- Transition message "Moving on to **Problem Framing**" appears between stages
- Attribute-specific question appears correctly
- Messages scroll properly
- Chat bubble styling: assistant = dark card, user = cyan primary
- Sparkles icon on assistant messages

## Branching flow verified:
- Grounding: 2 questions (project + context)
- Transitions to probing with attribute transition message
- Problem Framing primary question shown correctly

## Next: Test the full flow through all 8 attributes and LLM evaluation
