<?php
namespace App\Http\Controllers\Dashboards\AdminDashboard;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\StoreSectionRequest;
use App\Repository\Admin\SectionRepositoryInterface;

class SectionController extends Controller
{

  protected $sections;

  public function __construct(SectionRepositoryInterface $sections)
  {
      $this->sections = $sections;
  }

  public function index()
  {
  
    return $this->sections->index();

  }

  public function details($id)
  {
  
    return $this->sections->details($id);

  }

 

  
  public function store(StoreSectionRequest $request)
  {

  return $this->sections->store($request);

  }


  public function update(StoreSectionRequest $request)
  {


  return $this->sections->update($request);

  }

  public function destroy(request $request)
  {
    return $this->sections->destroy($request);

  }

  public function getclasses($id)
    {

        return $this->sections->getclasses($id);
    }

    public function getsections($id)
    {
        return $this->sections->getsections($id);
    }

    public function notes($id)
    {
        return $this->sections->notes($id);
    }


}

?>
