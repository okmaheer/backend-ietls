// services/openaiService.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt stored in code - NOT sent every time (saves tokens and cost)
const SYSTEM_PROMPT = `You are an expert IELTS Writing examiner. Evaluate writing tasks strictly according to official IELTS Writing Band Score Descriptors.

Your evaluation must be returned as valid JSON only. No additional text, explanations, or markdown formatting.

For each task, provide:
1. Band scores for: task_achievement (Task 1) OR task_response (Task 2), coherence_cohesion, lexical_resource, grammatical_accuracy
2. Overall band score for the task
3. Detailed evaluation feedback (280-320 words, do not exceed 350 words)
4. Top 2-3 key actionable improvements with practical strategies
5. IMPORTANT: For EACH criterion, provide specific mistakes/issues found with examples from the student's answer

Evaluation Guidelines:
✅ Task Response (Task 2): Check relevance of ideas to the question. Assess whether ideas are fully developed with clear reasons and examples. Confirm a consistent and clear position throughout the essay. Identify lapses in content such as missing explanation or unclear arguments.

✅ Task Achievement (Task 1): For Academic - Check if key features are clearly selected, accurately compared, and illustrated. For General Training - Ensure all bullet points are fully addressed and extended with relevant details. Identify any irrelevant or missing content.

✅ Grammar: Identify grammatical errors (subject-verb agreement, articles, prepositions, punctuation). Evaluate range and accuracy of sentence structures (compound, complex, conditional, relative clauses). Comment on clarity and control of punctuation. Provide 2-4 specific examples of grammatical mistakes with corrections.

✅ Lexical Resource: Check if vocabulary is appropriate for the task and topic. Evaluate collocation accuracy and precision of word choice. Identify spelling errors or informal/incorrect language. Note use of advanced or less common vocabulary when appropriate. Provide 2-4 specific examples of vocabulary issues with better alternatives.

✅ Coherence & Cohesion: Assess effective use of paragraphing (one clear idea per paragraph). Check logical organization and clear progression of ideas. Identify cohesion issues such as repetition or unclear referencing. Evaluate the natural and accurate use of linking devices and substitution. Provide 2-3 specific examples of coherence/cohesion issues.

Provide actionable suggestions for improvement after each criterion. Keep feedback clear, concise, and directly linked to the student's response. Focus on the most important weaknesses that will help the student improve quickly.

Band Score Rounding:
- 6.1 → 6.0
- 6.25+ → 6.5
- 6.75+ → 7.0
- Below 6.25 (not exactly 6.25) → 6.0
- Below 6.75 (not exactly 6.75) → 6.5

If both tasks submitted:
Average Band Score = (Task 1 bands + 2 * Task 2 bands) / 3

Response format MUST be valid JSON with criterion_details for each assessment criterion:
{
  "task1": {
    "task_achievement": 6.5,
    "task_achievement_details": "Specific feedback about task achievement: what was done well, what was missing, with examples from the answer.",
    "coherence_cohesion": 6.0,
    "coherence_cohesion_details": "Specific coherence and cohesion issues found. Examples: 'Paragraph 2 lacks a clear topic sentence', 'Overuse of 'however' as a linking device', 'Unclear pronoun reference in line 5'.",
    "lexical_resource": 6.5,
    "lexical_resource_details": "Specific vocabulary mistakes and suggestions. Examples: 'Use 'significant increase' instead of 'big increase'', 'Spelling error: 'enviroment' should be 'environment'', 'Repetition of 'important' - use synonyms like 'crucial', 'vital''.",
    "grammatical_accuracy": 6.0,
    "grammatical_accuracy_details": "Specific grammar mistakes with corrections. Examples: 'Subject-verb agreement error: 'The data shows' should be 'The data show'', 'Missing article: 'in conclusion' should be 'In conclusion'', 'Incorrect preposition: 'different to' should be 'different from''.",
    "overall_band": 6.0,
    "feedback": "Overall detailed feedback here...",
    "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"]
  },
  "task2": {
    "task_response": 6.5,
    "task_response_details": "Specific feedback about task response: how well the question was addressed, quality of ideas and examples.",
    "coherence_cohesion": 6.5,
    "coherence_cohesion_details": "Specific coherence and cohesion issues found with examples.",
    "lexical_resource": 6.0,
    "lexical_resource_details": "Specific vocabulary mistakes and suggestions with examples.",
    "grammatical_accuracy": 6.5,
    "grammatical_accuracy_details": "Specific grammar mistakes with corrections and examples.",
    "overall_band": 6.5,
    "feedback": "Overall detailed feedback here...",
    "improvements": ["Improvement 1", "Improvement 2"]
  },
  "average_band": 6.5
}

If only one task is submitted, omit the other task from JSON and set average_band to that task's overall_band.`;

/**
 * Evaluate IELTS Writing Test using GPT-4o-mini
 * @param {Object} submissionData - Contains questions and answers
 * @param {Object} submissionData.task1 - Task 1 data (optional)
 * @param {string} submissionData.task1.question - Task 1 question
 * @param {string} submissionData.task1.answer - Task 1 answer
 * @param {number} submissionData.task1.wordCount - Task 1 word count
 * @param {Object} submissionData.task2 - Task 2 data (optional)
 * @param {string} submissionData.task2.question - Task 2 question
 * @param {string} submissionData.task2.answer - Task 2 answer
 * @param {number} submissionData.task2.wordCount - Task 2 word count
 * @returns {Promise<Object>} AI evaluation results
 */
export async function evaluateWritingTest(submissionData) {
  try {
    // Build user message with questions and answers
    let userMessage = '';

    if (submissionData.task1) {
      userMessage += `TASK 1 (Academic/General Training Writing):\n`;
      userMessage += `Question: ${submissionData.task1.question}\n\n`;
      userMessage += `Student's Answer (${submissionData.task1.wordCount} words):\n${submissionData.task1.answer}\n\n`;
    }

    if (submissionData.task2) {
      userMessage += `TASK 2 (Essay Writing):\n`;
      userMessage += `Question: ${submissionData.task2.question}\n\n`;
      userMessage += `Student's Answer (${submissionData.task2.wordCount} words):\n${submissionData.task2.answer}\n\n`;
    }

    userMessage += `\nProvide evaluation as JSON only.`;

    // Call OpenAI API with GPT-4o-mini (cost-effective)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost: ~$0.15/1M input tokens, ~$0.60/1M output tokens
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' }, // Force JSON output
      temperature: 0.3, // Lower temperature for consistent evaluation
      max_tokens: 2000, // Sufficient for detailed feedback
    });

    // Parse JSON response
    const evaluation = JSON.parse(response.choices[0].message.content);

    // Add zero bands for empty tasks
    if (!submissionData.task1 && !evaluation.task1) {
      evaluation.task1 = {
        task_achievement: 0,
        task_achievement_details: "No answer was provided for this task.",
        coherence_cohesion: 0,
        coherence_cohesion_details: "No answer was provided for this task.",
        lexical_resource: 0,
        lexical_resource_details: "No answer was provided for this task.",
        grammatical_accuracy: 0,
        grammatical_accuracy_details: "No answer was provided for this task.",
        overall_band: 0,
        feedback: "No answer submitted for Task 1.",
        improvements: ["Please attempt Task 1 in your next submission."]
      };
    }

    if (!submissionData.task2 && !evaluation.task2) {
      evaluation.task2 = {
        task_response: 0,
        task_response_details: "No answer was provided for this task.",
        coherence_cohesion: 0,
        coherence_cohesion_details: "No answer was provided for this task.",
        lexical_resource: 0,
        lexical_resource_details: "No answer was provided for this task.",
        grammatical_accuracy: 0,
        grammatical_accuracy_details: "No answer was provided for this task.",
        overall_band: 0,
        feedback: "No answer submitted for Task 2.",
        improvements: ["Please attempt Task 2 in your next submission."]
      };
    }

    // Add metadata
    evaluation.tokens_used = response.usage.total_tokens;
    evaluation.estimated_cost = (
      (response.usage.prompt_tokens / 1000000) * 0.15 +
      (response.usage.completion_tokens / 1000000) * 0.60
    ).toFixed(6);

    return {
      success: true,
      data: evaluation,
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);

    // Return error with fallback
    return {
      success: false,
      error: error.message || 'Failed to evaluate writing test',
      data: null,
    };
  }
}

/**
 * Calculate average band score according to IELTS formula
 * @param {number} task1Band - Task 1 overall band score
 * @param {number} task2Band - Task 2 overall band score
 * @returns {number} Rounded average band score
 */
export function calculateAverageBand(task1Band, task2Band) {
  if (!task1Band && !task2Band) return 0;
  if (!task1Band) return roundBandScore(task2Band);
  if (!task2Band) return roundBandScore(task1Band);

  // Formula: (Task 1 + 2*Task 2) / 3
  const average = (task1Band + (2 * task2Band)) / 3;
  return roundBandScore(average);
}

/**
 * Round band score according to IELTS rules
 * @param {number} score - Raw score
 * @returns {number} Rounded score
 */
function roundBandScore(score) {
  const decimal = score - Math.floor(score);

  if (decimal < 0.25) {
    return Math.floor(score);
  } else if (decimal >= 0.25 && decimal < 0.75) {
    return Math.floor(score) + 0.5;
  } else {
    return Math.ceil(score);
  }
}
