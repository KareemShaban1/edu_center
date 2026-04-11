@extends('layouts.master')

@section('content')
<h2>Create New Room</h2>

<form action="{{ route('rooms.store') }}" method="POST" class="mt-3">
    @csrf
    <div class="mb-3">
        <label class="form-label">Room Name</label>
        <input type="text" name="name" class="form-control" required placeholder="e.g. team-meeting">
        <div class="form-text">Use letters, numbers, dashes only.</div>
        @error('name') <div class="text-danger mt-1">{{ $message }}</div> @enderror
    </div>
    <button class="btn btn-primary">Create & Join</button>
</form>
@endsection