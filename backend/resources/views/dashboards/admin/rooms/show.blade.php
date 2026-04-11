@extends('layouts.master')

@section('content')
<div class="container">
    <h2>Room: {{ $roomName }}</h2>
    <div id="jitsi-container" style="height: 600px;"></div>
</div>

<script src='https://8x8.vc/vpaas-magic-cookie-b186c10f038b4758b015215796ac4ee3/external_api.js' async></script>

<script>
    window.onload = () => {
        const api = new JitsiMeetExternalAPI("8x8.vc", {
            roomName: `vpaas-magic-cookie-b186c10f038b4758b015215796ac4ee3/{{ $roomName }}`,
            parentNode: document.querySelector('#jitsi-container'),
            userInfo: {
                displayName: "{{ auth()->user()?->name ?? 'Guest' }}"
            }
            // Make sure to include a JWT if you intend to record,
            // make outbound calls or use any other premium features!
            // jwt: "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtYjE4NmMxMGYwMzhiNDc1OGIwMTUyMTU3OTZhYzRlZTMvNGUyN2FiLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NTExMDE3NDcsImV4cCI6MTc1MTEwODk0NywibmJmIjoxNzUxMTAxNzQyLCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtYjE4NmMxMGYwMzhiNDc1OGIwMTUyMTU3OTZhYzRlZTMiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOmZhbHNlLCJvdXRib3VuZC1jYWxsIjpmYWxzZSwic2lwLW91dGJvdW5kLWNhbGwiOmZhbHNlLCJ0cmFuc2NyaXB0aW9uIjpmYWxzZSwicmVjb3JkaW5nIjpmYWxzZSwiZmxpcCI6ZmFsc2V9LCJ1c2VyIjp7ImhpZGRlbi1mcm9tLXJlY29yZGVyIjpmYWxzZSwibW9kZXJhdG9yIjp0cnVlLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWQiOiJnb29nbGUtb2F1dGgyfDEwODk3NDMyODA5NDExNDgzODgyNSIsImF2YXRhciI6IiIsImVtYWlsIjoidGVzdC51c2VyQGNvbXBhbnkuY29tIn19LCJyb29tIjoiKiJ9.EeOXbaCfFRPH0qE6p1a_lPphkC43r_s4BErfx4GBim467eSpK1EdimvtVsWTRqp7uRCA_iERI4bA8-UacsXpu-Z4X_1jrmGOn4uhcI7XhxdpyR6iaZjd56Ilq2mlDGr9b76_RNzoki2y_8B1gBNujO2Qrrk3nj4AqVxeqgbEHDkZQhvyIErK_U3pORCj1QnxZ2J1UQHJhlgBTsSDtg-dfBIihX5CPEV5t299nNEy-QrqpKTa2LJEIQxFCy3L10JJhqaFsaGR4SFwDFAdmMuP6N_IH-kDX0ZOC0QvUa3ah1S1-kopW4K2936yBI_pT7wPU42UM4xbNUJpctkEDATeRQ"
        });
    }
</script>
@endsection