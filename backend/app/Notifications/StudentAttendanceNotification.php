<?php

namespace App\Notifications;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StudentAttendanceNotification extends Notification implements ShouldBroadcast
{
    use Queueable;
    protected $attendance;


    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct($attendance)
    {
        $this->attendance = $attendance;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['database', 'broadcast']; // You can add more channels like 'broadcast', 'nexmo' for SMS, etc.
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Child\'s Attendance Update')
            ->from('notify@EduBenha.com')
            ->line("Dear Parent,")
            ->line("Your child, {$this->attendance->student->name}, has an attendance update.")
            ->line("Status: " . ($this->attendance->attendance_status ? 'Present' : 'Absent'));
    }


    // for database notifications
    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        $status = $this->attendance->attendance_status === 'present' ? 'present' : 'absent';

        return [
            'title' => __('notifications.attendance_update_title'),
            'body'  => __('notifications.student_attendance_update_body', [
                'name'   => $this->attendance->student->name,
                'status' => $this->attendance->attendance_status
                    ? __('notifications.present')
                    : __('notifications.absent'),
                    'date'   => Carbon::parse($this->attendance->attendance_date)->format('Y-m-d'),
                ]),
        ];
    }

    // for broadcast / real time notifications
    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage([
            'title' => __('notifications.attendance_update_title'),
            'body'  => __('notifications.student_attendance_update_body', [
                'name'   => $this->attendance->student->name,
                'status' => $this->attendance->attendance_status
                    ? __('notifications.present')
                    : __('notifications.absent'),
                    'date'   => Carbon::parse($this->attendance->attendance_date)->format('Y-m-d'),
                ]),
        ]);
    }
}