@forelse ($books as $book)
    <div class="col-md-3 col-lg-3">
        <div class="card shadow-lg border-4 h-100">
            <div class="card-body">
                <h5 class="fw-bold text-primary">{{ $book->title }}</h5>
                
                <p class="text-muted small mb-2">
                    <i class="fa fa-calendar"></i>
                    {{ $book->created_at->format('Y-m-d') }}
                </p>
                <a href="{{ route('student.download', $book->id) }}" 
                   class="btn btn-sm btn-warning">
                    <i class="fas fa-download"></i> {{ __('Download') }}
                </a>
            </div>
        </div>
    </div>
@empty
    <div class="col-12">
        <div class="alert alert-info text-center">
            {{ __('No books found for the selected filters.') }}
        </div>
    </div>
@endforelse
