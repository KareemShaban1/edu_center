<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsappTemplate extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'content', 'variables'];
    protected $casts = [
        'variables' => 'array',
    ];

    public function render(array $data): string
    {
        $message = $this->content;
        foreach ($this->variables ?? [] as $key) {
            $message = str_replace('{{' . $key . '}}', $data[$key] ?? '', $message);
        }
        return $message;
    }
}
