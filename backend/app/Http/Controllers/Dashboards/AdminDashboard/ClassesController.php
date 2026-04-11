<?php


namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClassesRequest;
use App\Http\Requests\UpdateClassesRequest;
use App\Repository\Admin\ClassesRepositoryInterface;
use Illuminate\Http\Request;

class ClassesController extends Controller
{

    protected $classes;

    public function __construct(ClassesRepositoryInterface $class)
    {
        $this->classes = $class;
    }


    public function index()
    {
        return $this->classes->index();

    }


    public function create()
    {

        return $this->classes->create();
    }


    public function store(StoreClassesRequest $request)
    {

        return $this->classes->store($request);

    }

       public function show($id)
    {
        return $this->classes->show($id);

    }



    public function edit($id)
    {

        return $this->classes->edit($id);
    }


    public function update(UpdateClassesRequest $request)
    {

        return $this->classes->update($request);


    }


    public function destroy(Request $request)
    {
        return $this->classes->destroy($request);

    }

    public function notes($id)
    {
        return $this->classes->notes($id);
    }

    public function classQuestions($id)
    {

        return $this->classes->classQuestions($id);
    }

    public function printQuestions($id)
    {
        return $this->classes->printQuestions($id);
    }

    public function questionModel($id)
    {
        return $this->classes->questionModel($id);
    }

    public function classUnitsLessons($id)
    {
        return $this->classes->classUnitsLessons($id);
    }

    public function lessonQuestions($id)
    {
        return $this->classes->lessonQuestions($id);
    }



}

?>
