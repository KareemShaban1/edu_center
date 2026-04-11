@extends('layouts.master')

@section('content')
<h2 class="mb-4">Available Rooms</h2>

<a href="{{ route('rooms.create') }}" class="btn btn-primary mb-3">+ Create New Room</a>

<ul class="list-group">
    @forelse ($rooms as $room)
    <li class="list-group-item d-flex justify-content-between">
        <strong>{{ $room->name }}</strong>
        <a href="{{ route('rooms.show', $room->name) }}" class="btn btn-sm btn-success">Join</a>
    </li>
    @empty
    <li class="list-group-item">No rooms available.</li>
    @endforelse
</ul>
@endsection