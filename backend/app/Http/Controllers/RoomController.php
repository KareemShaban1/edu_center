<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index()
    {
        return view('dashboards.admin.rooms.index', ['rooms' => Room::all()]);
    }

    public function create()
    {
        return view('dashboards.admin.rooms.create');
    }

    public function store(Request $request)
    {
        $room = Room::create([
            'name' => str()->slug($request->name),
        ]);

        return redirect()->route('rooms.show', $room->name);
    }

    public function show($name)
    {
        return view('dashboards.admin.rooms.show', ['roomName' => $name]);
    }
}
