<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Http\Requests\StoreQuestionRequest;
use App\Http\Requests\UpdateQuestionRequest;
use App\Models\Answer;
use App\Models\Classes;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \App\Http\Requests\StoreQuestionRequest  $request
     * @return \Illuminate\Http\Response
     */

     public function storeOrUpdateFromLesson(Request $request)
     {
        try {
            $data = $request->validate([
                'class_id' => 'required|exists:classes,id',
               //  'unit_id' => 'required|exists:units,id',
                'lesson_id' => 'required|exists:lessons,id',
                'questions' => 'required|array',
                'questions.*.id' => 'nullable|exists:questions,id',
                'questions.*.question_text' => 'required|string',
                'questions.*.type' => 'required|string|in:mcq,true_false,short_answer',
                'questions.*.correct_answer' => 'nullable|string',
                'questions.*.answers' => 'nullable|array',
                'questions.*.correct_answers' => 'nullable|array',
            ]);
        
            $class = Classes::findOrFail($request->class_id);
        
            foreach ($data['questions'] as $questionData) {
                if (isset($questionData['id'])) {
                    $question = Question::findOrFail($questionData['id']);
                    $question->update([
                        'class_id' => $class->id,
                        'lesson_id' => $request->lesson_id,
                        'grade_id' => $class->grade_id,
                        'question_text' => $questionData['question_text'],
                        'type' => $questionData['type']
                    ]);
                } else {
                    $question = Question::create([
                        'class_id' => $class->id,
                        'lesson_id' => $request->lesson_id,
                        'grade_id' => $class->grade_id,
                        'question_text' => $questionData['question_text'],
                        'type' => $questionData['type']
                    ]);
                }
        
                if (!$question) {
                    throw new \Exception("Failed to save question.");
                }
        
                // Handle answers update without deleting all
                if ($questionData['type'] === 'mcq' && isset($questionData['answers'])) {
                    $existingAnswers = $question->answers()->pluck('answer_text', 'id')->toArray();
                    $newAnswers = $questionData['answers'];
        
                    $correctAnswers = $questionData['correct_answers'] ?? [];
        
                    // Update or Create answers
                    foreach ($newAnswers as $answerText) {
                        $answer = Answer::where('question_id', $question->id)
                            ->where('answer_text', $answerText)
                            ->first();
        
                        if ($answer) {
                            // Update if the answer exists
                            $answer->update([
                                'is_correct' => in_array($answerText, $correctAnswers),
                            ]);
                        } else {
                            // Create if the answer does not exist
                            Answer::create([
                                'question_id' => $question->id,
                                'answer_text' => $answerText,
                                'is_correct' => in_array($answerText, $correctAnswers),
                            ]);
                        }
                    }
        
                    // Delete answers that are not in the new input
                    $answersToDelete = array_diff($existingAnswers, $newAnswers);
                    Answer::where('question_id', $question->id)
                        ->whereIn('answer_text', $answersToDelete)
                        ->delete();
                } elseif ($questionData['type'] === 'true_false') {
                    $trueAnswer = Answer::firstOrCreate(
                        ['question_id' => $question->id, 'answer_text' => 'True'],
                        ['is_correct' => $questionData['correct_answer'] === 'true']
                    );
                    $trueAnswer->update(['is_correct' => $questionData['correct_answer'] === 'true']);
        
                    $falseAnswer = Answer::firstOrCreate(
                        ['question_id' => $question->id, 'answer_text' => 'False'],
                        ['is_correct' => $questionData['correct_answer'] === 'false']
                    );
                    $falseAnswer->update(['is_correct' => $questionData['correct_answer'] === 'false']);
                } elseif ($questionData['type'] === 'short_answer') {
                    Answer::updateOrCreate(
                        ['question_id' => $question->id],
                        ['answer_text' => $questionData['correct_answer'], 'is_correct' => true]
                    );
                }
            }
        
            return redirect()->back()->with('toast_success', 'Questions saved successfully!');
        } catch (\Throwable $th) {
            //throw $th;
            dd($th);
            return redirect()->back()->with('toast_error', 'Questions saved failed!');
        }
 
     }

     public function storeOrUpdateFromClass(Request $request)
     {
        try {
            $data = $request->validate([
                'class_id' => 'required|exists:classes,id',
               //  'unit_id' => 'required|exists:units,id',
                // 'lesson_id' => 'required|exists:lessons,id',
                'questions' => 'required|array',
                'questions.*.id' => 'nullable|exists:questions,id',
                'questions.*.lesson_id' => 'required|exists:lessons,id',
                'questions.*.question_text' => 'required|string',
                'questions.*.type' => 'required|string|in:mcq,true_false,short_answer',
                'questions.*.correct_answer' => 'nullable|string',
                'questions.*.answers' => 'nullable|array',
                'questions.*.correct_answers' => 'nullable|array',
            ]);
        
            $class = Classes::findOrFail($request->class_id);
        
            foreach ($data['questions'] as $questionData) {
                if (isset($questionData['id'])) {
                    $question = Question::findOrFail($questionData['id']);
                    $question->update([
                        'class_id' => $class->id,
                        'lesson_id' => $questionData['lesson_id'],
                        'grade_id' => $class->grade_id,
                        'question_text' => $questionData['question_text'],
                        'type' => $questionData['type']
                    ]);
                } else {
                    $question = Question::create([
                        'class_id' => $class->id,
                        'lesson_id' => $questionData['lesson_id'],
                        'grade_id' => $class->grade_id,
                        'question_text' => $questionData['question_text'],
                        'type' => $questionData['type']
                    ]);
                }
        
                if (!$question) {
                    throw new \Exception("Failed to save question.");
                }
        
                // Handle answers update without deleting all
                if ($questionData['type'] === 'mcq' && isset($questionData['answers'])) {
                    $existingAnswers = $question->answers()->pluck('answer_text', 'id')->toArray();
                    $newAnswers = $questionData['answers'];
        
                    $correctAnswers = $questionData['correct_answers'] ?? [];
        
                    // Update or Create answers
                    foreach ($newAnswers as $answerText) {
                        $answer = Answer::where('question_id', $question->id)
                            ->where('answer_text', $answerText)
                            ->first();
        
                        if ($answer) {
                            // Update if the answer exists
                            $answer->update([
                                'is_correct' => in_array($answerText, $correctAnswers),
                            ]);
                        } else {
                            // Create if the answer does not exist
                            Answer::create([
                                'question_id' => $question->id,
                                'answer_text' => $answerText,
                                'is_correct' => in_array($answerText, $correctAnswers),
                            ]);
                        }
                    }
        
                    // Delete answers that are not in the new input
                    $answersToDelete = array_diff($existingAnswers, $newAnswers);
                    Answer::where('question_id', $question->id)
                        ->whereIn('answer_text', $answersToDelete)
                        ->delete();
                } elseif ($questionData['type'] === 'true_false') {
                    $trueAnswer = Answer::firstOrCreate(
                        ['question_id' => $question->id, 'answer_text' => 'True'],
                        ['is_correct' => $questionData['correct_answer'] === 'true']
                    );
                    $trueAnswer->update(['is_correct' => $questionData['correct_answer'] === 'true']);
        
                    $falseAnswer = Answer::firstOrCreate(
                        ['question_id' => $question->id, 'answer_text' => 'False'],
                        ['is_correct' => $questionData['correct_answer'] === 'false']
                    );
                    $falseAnswer->update(['is_correct' => $questionData['correct_answer'] === 'false']);
                } elseif ($questionData['type'] === 'short_answer') {
                    Answer::updateOrCreate(
                        ['question_id' => $question->id],
                        ['answer_text' => $questionData['correct_answer'], 'is_correct' => true]
                    );
                }
            }
        
            return redirect()->back()->with('toast_success', 'Questions saved successfully!');
        } catch (\Throwable $th) {
            //throw $th;
            // dd($th);
            return redirect()->back()->with('toast_error', 'Questions saved failed!');
        }
 
     }
     

    /**
     * Update a question.
     */
    public function update(Request $request, Question $question)
    {
        $data = $request->validate([
            'question_text' => 'required|string',
            'type' => 'required|string|in:mcq,true_false,short_answer',
            'correct_answer' => 'nullable|string',
            'answers' => 'nullable|array',
            'correct_answers' => 'nullable|array',
            'class_id' => 'required|exists:classes,id',
            // 'unit_id' => 'required|exists:units,id',
            'lesson_id' => 'required|exists:lessons,id',
        ]);

        $question->update([
            'question_text' => $data['question_text'],
            'type' => $data['type']
        ]);

        // Delete old answers
        $question->answers()->delete();

        // Re-add answers
        if ($data['type'] === 'mcq' && isset($data['answers'])) {
            foreach ($data['answers'] as $index => $answerText) {
                Answer::create([
                    'question_id' => $question->id,
                    'answer_text' => $answerText,
                    'is_correct' => in_array($index, $data['correct_answers'] ?? [])
                ]);
            }
        } elseif ($data['type'] === 'true_false') {
            Answer::create([
                'question_id' => $question->id,
                'answer_text' => 'True',
                'is_correct' => $data['correct_answer'] === 'true'
            ]);
            Answer::create([
                'question_id' => $question->id,
                'answer_text' => 'False',
                'is_correct' => $data['correct_answer'] === 'false'
            ]);
        } elseif ($data['type'] === 'short_answer') {
            Answer::create([
                'question_id' => $question->id,
                'answer_text' => $data['correct_answer'],
                'is_correct' => true
            ]);
        }

        return redirect()->back()->with('success', 'Question updated successfully!');
    }

    /**
     * Delete a question.
     */
    public function destroy(Question $question)
    {
        $question->answers()->delete();
        $question->delete();
    
        if (request()->ajax()) {
            return response()->json(['message' => 'Question deleted successfully!']);
        }
    
        return redirect()->back()->with('success', 'Question deleted successfully!');
    }
    
    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Question  $question
     * @return \Illuminate\Http\Response
     */
    public function show(Question $question)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Question  $question
     * @return \Illuminate\Http\Response
     */
    public function edit(Question $question)
    {
        //
    }
}
